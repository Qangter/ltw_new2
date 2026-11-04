# Tầng dịch vụ

[apiClient](./apiClient.js) dùng fetch, đường dẫn cùng origin `/api/...`; proxy ở [vite.config.js](../../vite.config.js). Không hardcode origin trong page. Lấy client thuộc phiên từ `useAuth().api`, không tạo singleton đọc token động cho request nghiệp vụ.

```jsx
const { api, sessionId } = useAuth()
const params = { q, semester_id, page, pageSize }
const result = useQuery({
  queryKey: queryKeys.list(sessionId, 'students', params),
  queryFn: ({ signal }) => api('/api/students', { query: params, signal }),
})
```

Đây là ví dụ cấu trúc, không phải hook đã triển khai; dùng tên query parameter thực tế trong [baseline](../../../docs/react-migration-baseline.md). Service/hook mỗi feature phải truyền **toàn bộ** tham số có ảnh hưởng response vào key, kể cả ID/filter/page/sort. `queryKeys.resource(sessionId, resource)` dùng invalidation theo nhóm. Không dùng token hoặc mật khẩu làm query key, không persist cache nghiệp vụ vào localStorage.

- JSON: `api(path, { method: 'POST', body: payload })`. Không stringify trước. Không đặt `queryFn` cho thao tác ghi; dùng `useMutation`, không override retry cho mutation.
- Upload: body là FormData; client tự bỏ Content-Type để browser sinh boundary. Chức năng import thuộc giai đoạn 7.
- Download: `api(path, { responseType: 'blob', signal })`; caller quản lý/revoke object URL. Lỗi HTTP vẫn parse JSON message/status dù request blob.
- `query` bỏ null/undefined, giữ 0/false/chuỗi rỗng; array thành tham số lặp. `AbortSignal` của query kết hợp với abort của phiên.
- Lỗi `ApiError`: `status` là HTTP status, `0` khi không có response; `data` giữ JSON lỗi. Abort dùng `name === 'AbortError'`, không hiển thị như lỗi thao tác. 401 có token tự kết thúc phiên, 403 không logout. Client không tự retry bất kỳ request nào.
- UI query: `isPending` cho tải ban đầu, `isFetching && !isPending` cho refetch nền; giữ dữ liệu đang hiển thị và báo lỗi nền riêng, chỉ empty khi request thành công có dữ liệu rỗng. Không reset form theo query/refetch. Thực hiện tại feature khi chuyển trang giai đoạn 4+.
- Mỗi phiên có QueryClient riêng, cache bị clear khi logout/đổi tài khoản. Request từ client cũ luôn bị hủy, kể cả fetch/response cũ trả muộn. Không giữ api/client ngoài vòng đời phiên hoặc ghi response vào global state riêng.
- Login và `/me` do auth session quản lý ngoài query cache; không retry tự động. Đổi mật khẩu dùng mutation, không lưu credentials vào cache query.
