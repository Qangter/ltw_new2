# Frontend React — giai đoạn 3

React/Vite JavaScript chạy độc lập với [frontend cũ](../fe/). Đã có đăng nhập, khôi phục phiên qua `/api/auth/me`, logout, đổi mật khẩu và guard/menu theo role. **Các trang nghiệp vụ giai đoạn 4–7 vẫn là placeholder**, không giả dữ liệu. Express vẫn phục vụ frontend cũ.

## Chạy phát triển

Yêu cầu Node `^22.13.0 || ^24.0.0 || >=26.0.0`. Đã kiểm tra trên Node 22.19.0, npm 10.9.3, Windows. Dùng lockfile để cài lại bộ phiên bản đã kiểm tra.

Chạy tại thư mục gốc repository:

```powershell
npm --prefix fe-react ci
npm --prefix fe-react run dev
```

Nếu PowerShell chặn script npm.ps1, thay `npm` bằng `npm.cmd`.

- React: http://127.0.0.1:5173/#/login
- Sau đăng nhập: ADMIN/TEACHER về `#/dashboard`, STUDENT về `#/my`.
- Trang thử component, chỉ khi chạy dev và đã đăng nhập: http://127.0.0.1:5173/#/__components

Terminal thứ hai, dùng cấu hình backend/database hiện có:

```powershell
npm --prefix be start
```

Frontend cũ tiếp tục ở http://localhost:3000. Không cần reset hoặc seed lại database. Backend phải kết nối MySQL thành công mới listen. Không đưa thông tin bí mật database vào biến `VITE_*`.

Có thể dùng các task VS Code trong [tasks.json](../.vscode/tasks.json): `React: dev`, `React: build`, `Backend: start (legacy)`. Dừng bằng Ctrl+C hoặc **Tasks: Terminate Task**.

## Proxy API

[vite.config.js](./vite.config.js) proxy nguyên đường dẫn `/api` sang `http://localhost:3000`; không rewrite hoặc thay response. Khi backend ở cổng khác, tạo file cấu hình local theo [.env.example](./.env.example), đặt `API_PROXY_TARGET` và restart Vite. Đây là cấu hình phía dev server, không gửi origin này vào bundle trình duyệt.

Kiểm tra read-only sau khi cả hai server đang chạy:

```powershell
npm --prefix fe-react run check:proxy
```

[Script kiểm tra](./scripts/check-proxy.mjs) xác minh frontend cũ và React đều trả 200; `/api/auth/me` không token trả 401 JSON và API không tồn tại trả 404 JSON giống gọi trực tiếp backend. Script không đăng nhập, không ghi DB và không dùng server giả.

Kiểm tra này chỉ chứng minh kết nối/proxy và hợp đồng lỗi không xác thực; **không chứng minh dữ liệu đã được tích hợp hoặc phân quyền nghiệp vụ đã hoàn tất**.

## Lint, test và build

```powershell
npm --prefix fe-react run lint
npm --prefix fe-react test
npm --prefix fe-react run test:watch
npm --prefix fe-react run test:e2e
npm --prefix fe-react run build
npm --prefix fe-react run preview
```

- Vitest + React Testing Library + jsdom: 46 kiểm tra API client, phiên/race/cache, route/menu 3 role, login/password, phân trang, toast và modal. Transport được mock rõ ràng; không phải nghiệm thu backend. jsdom chỉ shim showModal/close, không giả lập đầy đủ top layer/inert.
- Playwright mặc định: 9 kiểm tra UI với auth fixture, 5 ca backend thật được skip. Kiểm tra URL hash/Back/refresh, guard, login/password/logout, logout giữa hai tab, modal focus và viewport 360/768/1280px. Vite cổng 5180 dùng mode/cache E2E riêng; chạy 2 worker để hạn chế quá tải Chrome local.
- Mặc định Playwright dùng Chrome đã cài. Có thể chọn Edge bằng `$env:PLAYWRIGHT_CHANNEL='msedge'` trong PowerShell trước khi chạy. Chưa kiểm tra Firefox/WebKit.
- Trên máy không có Chrome/Edge, cài trình duyệt phù hợp hoặc cấu hình channel trong [playwright.config.js](./playwright.config.js). Không tự tải browser trong postinstall.
- Test output/screenshot/trace nằm ở thư mục bị gitignore, không đưa vào mã nguồn. Trang `__components` chỉ là bàn kiểm tra UI, không phải tính năng nghiệp vụ.
- Build tạo thư mục `dist/` tự đủ CSS/logo/JS. Preview cổng 4173 dùng để kiểm tra build, không phải triển khai production. Express **chưa** phục vụ bản build React; việc đó thuộc giai đoạn 8.
- Vite dùng strictPort: nếu cổng 5173/4173/5180 bị chiếm, báo lỗi để tránh kiểm tra nhầm server. Có thể truyền `-- --port <cổng>` khi chạy dev/preview; với check:proxy, đặt `FRONTEND_URL` tương ứng.

## Tổ chức mã nguồn

| Thư mục | Vai trò |
|---|---|
| [src/app](./src/app/) | App, providers, HashRouter, cấu hình route/menu |
| [src/components](./src/components/) | Layout, Card/Badge/Pagination, feedback và overlay |
| [src/features](./src/features/) | Page riêng theo tính năng; component/hook nghiệp vụ sẽ được thêm tại feature tương ứng khi chuyển trang |
| [src/services](./src/services/) | Fetch client chung và hợp đồng dùng service/query |
| [src/hooks](./src/hooks/) | Hook dùng chung, hiện có useToast |
| [src/utils](./src/utils/) | Hàm thuần dùng chung, hiện có pagination |
| [src/styles](./src/styles/) | Import CSS gốc và bổ sung style React/responsive/accessibility |
| [src/test](./src/test/) | Setup kiểm thử component |
| [e2e](./e2e/) | Kiểm thử trình duyệt |

CSS được import từ [style.css gốc](../fe/css/style.css); logo import từ [logo gốc](../fe/assets/images/logo.png). Không sao chép hoặc sửa hai nguồn này. Dev server chỉ mở quyền đọc thêm thư mục frontend cũ; build đóng gói các asset, không fetch template HTML hay chạy script DOM cũ. Source React cần giữ cấu trúc repository này để resolve các import; riêng bản build không cần frontend cũ.

### Smoke test với backend thật

Khởi động backend development có dữ liệu hiện hữu rồi chạy trong PowerShell:

```powershell
$env:LIVE_AUTH='1'
npm.cmd --prefix fe-react run test:e2e
Remove-Item Env:LIVE_AUTH
```

5 ca thật dùng tài khoản demo đã được README gốc công bố: admin/admin123, teacher01/teacher123, student001/student123; kiểm tra login, `/me`, refresh, logout, guard và GET admin trả 403, mật khẩu sai, token không hợp lệ. Không ghi dữ liệu hoặc đổi mật khẩu. Nếu dữ liệu development đã thay credentials, cần cấu hình test tương ứng; **không seed/reset** để chạy test. Lần chạy 04/11/2026 đạt 14/14 (9 fixture + 5 thật). Đổi mật khẩu thành công mới kiểm tra bằng fixture, chưa ghi vào tài khoản thật.

## Route và ranh giới giai đoạn

Giữ đủ 12 route baseline: `#/login`, `#/dashboard`, `#/my`, `#/lookup`, `#/student/:id`, `#/entry`, `#/import`, `#/grades`, `#/stats`, `#/students`, `#/users`, `#/password`.

- Hash rỗng đi qua login rồi về trang chính theo role đã xác minh. Login thành công quay lại deep link nếu role được phép, nếu không về trang chính.
- Sidebar chỉ lấy role từ Auth Context sau `/me`; guard chặn URL trái quyền bằng trang 403, không render page nghiệp vụ. Backend vẫn thực thi quyền thật.
- Trang `student/:id` đánh dấu tra cứu sinh viên active. Route không tồn tại có trang thông báo riêng.
- [AppProviders](./src/app/AppProviders.jsx) ghép AuthProvider, QueryClientProvider và ToastProvider theo phiên. React Hook Form quản lý form; không đặt nghiệp vụ vào App.
- Modal dùng native dialog và portal, giữ focus, khôi phục focus/scroll khi đóng hoặc unmount. Escape được chặn khi ConfirmDialog pending; form/mutation ở parent chịu trách nhiệm bật/tắt pending, hiển thị error và đóng sau thành công. Click backdrop không tự đóng để tránh mất form.
- Toast có nút đóng, timeout mặc định 5 giây; hover/focus tạm dừng và cho một khoảng timeout mới khi rời. `duration: 0` giữ thông báo tới khi đóng.

## Phiên, cache và API

- [AuthProvider](./src/features/auth/AuthProvider.jsx) dùng [session store](./src/features/auth/authSession.js) với 3 trạng thái: `verifying`, `anonymous`, `authenticated`. Chỉ `/me` hợp lệ mới cấp user/role, kể cả sau login; không đọc JSON `user` để quyết định quyền.
- Giữ `localStorage.token` và `localStorage.user` tương thích bản cũ. Storage hỏng/bị chặn không làm crash; khi không lưu được, phiên chỉ tồn tại trong tab và có thông báo. Dev port khác origin nên không tự chia sẻ storage với frontend cũ.
- `/me` lỗi mạng/5xx/403: giữ token, vẫn chặn page, hiện lỗi + nút thử lại/đăng nhập lại. 401 từ request có token: kết thúc phiên và thông báo hết hạn. 401 login: lỗi thông tin đăng nhập; 403 API: giữ phiên, hiện lỗi quyền. Không có refresh-token/logout endpoint.
- Mỗi ranh giới phiên tạo API client và QueryClient mới; abort request, cancel queries và clear cả query/mutation cache cũ. Kiểm tra signal sau khi nhận/đọc response để response cũ (kể cả 401) không tác động phiên mới. Remount cây UI/toast theo phiên để bỏ draft riêng tư. Storage event token/clear đồng bộ tab khác.
- [queryKeys](./src/app/queryKeys.js) có prefix session; list/detail chứa đủ filters/page/ID. Quy ước sử dụng và ví dụ ở [services README](./src/services/README.md).
- Query đọc retry tối đa 2 lần cho lỗi mạng/server; không retry 4xx hoặc AbortError. Mutation `retry: false`, `networkMode: always` để không xếp hàng ghi offline; API client không tự retry. Không retry login/password tự động.
- Mật khẩu mới tối thiểu 6 ký tự, xác nhận tại client; payload giữ `old_password/new_password`. Lỗi giữ form, pending khóa input/nút, thành công reset và toast. Đổi mật khẩu không tự logout vì backend hiện tại không thu hồi JWT.
- **Hạn chế backend giữ nguyên:** JWT có hạn 8 giờ; khóa tài khoản/reset mật khẩu không thu hồi JWT đang tồn tại. `/me` không kiểm tra `is_active`; React không thể bảo đảm thu hồi tức thì. Xử lý hết hạn khi `/me` hoặc request tiếp theo trả 401, không có bộ đếm JWT/client refresh âm thầm. Token vẫn ở localStorage theo yêu cầu tương thích, chưa chuyển sang HttpOnly cookie.

## Kết quả và hạn chế dependency

Phiên bản chính được khóa: React 19.3.1, React Router 7.18.5, Vite 8.3.5, Vitest 5.1.0; thêm TanStack Query 5.105.3 và React Hook Form 7.91.0 ở giai đoạn 3. Xem [package.json](./package.json) và [package-lock.json](./package-lock.json).

Ngày 03/11/2026: `npm audit --omit=dev` báo 0; audit toàn bộ báo 6 mức moderate trong chuỗi công cụ ESLint/minimatch, không có high/critical. Chưa ép override major hoặc dùng `audit fix --force`; các cảnh báo dev còn tồn tại, không tuyên bố toàn bộ dependency sạch.

Ngày 04/11/2026 sau khi thêm hai dependency: chạy lại `npm.cmd audit --omit=dev` báo 0; installer vẫn báo 6 moderate cho toàn bộ tree.

Tham khảo triển khai: [Vite](https://vite.dev/guide/), [HashRouter](https://reactrouter.com/7.18.5/api/declarative-routers/HashRouter), [Vitest](https://vitest.dev/guide/), [native dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog).

Tham khảo giai đoạn 3: [TanStack Query cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation), [QueryClient](https://tanstack.com/query/latest/docs/framework/react/reference/classes/QueryClient), [React Hook Form](https://react-hook-form.com/docs/useform).

Xem [baseline](../docs/react-migration-baseline.md), [kế hoạch](../docs/ke-hoach-chuyen-frontend-react.md) và [nhật ký](../docs/react-migration-progress.md) trước khi thực hiện giai đoạn 4. Chưa tự chuyển sang trang đọc dữ liệu.
