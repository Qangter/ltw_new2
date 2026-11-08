# Frontend React — giai đoạn 8

React/Vite JavaScript chạy song song với [frontend cũ](../fe/). Đã có xác thực/phân quyền và các trang đọc: dashboard, thống kê, tra cứu, bảng điểm bản thân/chi tiết, danh sách điểm và lịch sử chỉnh sửa. Các trang đọc dùng API thật; chỉ test dùng fixture. Express chọn frontend qua `FRONTEND=legacy|react`, mặc định legacy.

Giai đoạn 5 có quản trị sinh viên/tài khoản; giai đoạn 6 có nhập/sửa điểm, lưu từng dòng/lưu tất cả, thêm sinh viên vào lớp và xóa điểm. Giai đoạn 7 có tải mẫu/import Excel, phản ánh kết quả từng phần và lỗi dòng từ API. Giai đoạn 8 bổ sung bảo vệ điều hướng khi import pending, cấu hình Express production, kiểm tra build/rollback và ma trận nghiệm thu. Test ghi DB thật vẫn chờ xác định môi trường development/test; không coi fixture là nghiệm thu ghi thật. Xem [nhật ký](../docs/react-migration-progress.md).

## Production và rollback

Từ root repository:

```powershell
npm --prefix fe-react run build
npm --prefix be run start:react -- 3001
```

Mở http://localhost:3001/#/login (bỏ `-- 3001` để dùng PORT cấu hình, mặc định 3000). React build gọi `/api` cùng Express; không chạy Vite trong production. Có thể đặt `FRONTEND=react` trong cấu hình backend rồi dùng `npm --prefix be start`. [Static middleware](../be/config/frontend.js) luôn sau API/JSON 404, không có fallback HTML cho URL lạ. Thiếu index build trả 503, mode sai chặn khởi động; index no-cache, asset có hash immutable. Script start có mode chọn rõ ưu tiên hơn biến shell/file `.env`.

Rollback: dừng Express, đặt `FRONTEND=legacy` rồi restart, hoặc `npm --prefix be run start:legacy -- 3001`; reload trang. Giữ nguyên frontend cũ và database. Xem [hướng dẫn root](../README.md).

```powershell
npm --prefix be run test:frontend
npm --prefix be run test:frontend:live
$env:LIVE_AUTH='1'
npm --prefix fe-react run test:e2e:production
Remove-Item Env:LIVE_AUTH
```

`test:frontend` dùng fixture static, không DB. `test:frontend:live` khởi động Express/MySQL thật trên cổng 5192 và kiểm tra rollback bằng HTTP chỉ đọc. [Production Playwright](./playwright.production.config.js) khởi động chính backend ở cổng 5181, phục vụ build đã tạo, tự dừng khi kết thúc; không tái dùng server lạ trên cổng đó. Giữ legacy ở localhost:3000 để đối chiếu. Loại riêng các test bàn component dev `__components`; vẫn chạy modal/form nghiệp vụ, responsive, in, nhập điểm, import và auth trên build. `LIVE_AUTH=1` chỉ bật login/GET/tải mẫu thật, không bật ghi DB. Các thao tác ghi khác trong suite được intercept fixture rõ ràng.

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

- Vitest + React Testing Library + jsdom: 143 kiểm tra API client, phiên/race/cache, route/menu, trang đọc, quản trị, nhập điểm, import, phân trang, toast và modal. Transport được mock rõ ràng; không phải nghiệm thu backend. jsdom chỉ shim showModal/close, không giả lập đầy đủ top layer/inert.
- Playwright: 39 ca fixture, 13 ca backend đọc/xác thực/tải mẫu bật bằng `LIVE_AUTH=1`, 1 ca HTTP production và 1 ca ghi quản trị cần bật riêng. Production đã đạt 47 ca trong cùng một lượt, bỏ qua 1 ca ghi quản trị; 6 ca foundation dev chạy riêng đều đạt. Discovery gồm [e2e](./e2e/) và `src/features/**/tests/browser/*.spec.js`. Có coverage draft/lưu một phần, multipart, Back/Forward, cảnh báo refresh, import đang xử lý, logout đổi người dùng, modal/responsive và print. Cả hai cấu hình dùng 2 worker; kết quả chi tiết trong nhật ký.
- Mặc định Playwright dùng Chrome đã cài. Có thể chọn Edge bằng `$env:PLAYWRIGHT_CHANNEL='msedge'` trong PowerShell trước khi chạy. Chưa kiểm tra Firefox/WebKit.
- Trên máy không có Chrome/Edge, cài trình duyệt phù hợp hoặc cấu hình channel trong [playwright.config.js](./playwright.config.js). Không tự tải browser trong postinstall.
- Test output/screenshot/trace nằm ở thư mục bị gitignore, không đưa vào mã nguồn. Trang `__components` chỉ là bàn kiểm tra UI, không phải tính năng nghiệp vụ.
- Build tạo thư mục `dist/` tự đủ CSS/logo/JS. Preview cổng 4173 dùng để kiểm tra build; production dùng Express với `FRONTEND=react` như hướng dẫn trên.
- Vite dùng strictPort: nếu cổng 5173/4173/5180 bị chiếm, báo lỗi để tránh kiểm tra nhầm server. Có thể truyền `-- --port <cổng>` khi chạy dev/preview; với check:proxy, đặt `FRONTEND_URL` tương ứng.

## Tổ chức mã nguồn

| Thư mục | Vai trò |
|---|---|
| [src/app](./src/app/) | App, providers, createHashRouter/RouterProvider, cấu hình route/menu và guard đăng xuất |
| [src/components](./src/components/) | Layout, Card/Badge/Pagination, feedback và overlay |
| [src/features](./src/features/) | Page, component, service/query hook theo feature; dashboard dùng chung hook/component thống kê |
| [src/services](./src/services/) | Fetch client chung và hợp đồng dùng service/query |
| [src/hooks](./src/hooks/) | useToast, useMeta, useRouteFilters |
| [src/utils](./src/utils/) | Phân trang và định dạng ngày/số; không tính lại GPA |
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

13 ca thật dùng tài khoản demo đã được README gốc công bố: admin/admin123, teacher01/teacher123, student001/student123. Gồm 5 ca xác thực, 3 ca đối chiếu trang đọc React/API/giao diện cũ, 2 ca đọc lớp nhập điểm và 3 ca tải mẫu/quyền template. Không ghi dữ liệu hoặc đổi mật khẩu. Nếu credentials đã thay, cần cấu hình test tương ứng; **không seed/reset** để chạy test. Các ca đối chiếu cần frontend cũ ở `http://localhost:3000` và dữ liệu đủ trang 2. Lịch sử chọn trong trang đang kiểm tra hoặc tối đa 100 bản ghi gần nhất; nếu không có edits thì xác minh API rỗng và ghi rõ modal có dữ liệu mới được kiểm tra bằng fixture.

## Các trang đọc giai đoạn 4

- ADMIN/TEACHER: `#/dashboard`, `#/stats`, `#/lookup`, `#/student/:id`, `#/grades`. STUDENT: `#/my`; không được mở bảng điểm người khác hay trang thống kê.
- [useRouteFilters](./src/hooks/useRouteFilters.js) lưu bộ lọc đã áp dụng/page trong query string của hash. Submit bộ lọc reset page; Back/Forward/refresh khôi phục giá trị. Bản nháp đang nhập không bị refetch nền ghi đè.
- [TranscriptView](./src/features/transcripts/TranscriptView.jsx) dùng chung cho bản thân và staff; [service](./src/features/transcripts/transcriptService.js) chọn `/api/students/me/transcript` hoặc `/api/students/:id/transcript`. Summary/GPA lấy từ API theo học kỳ, không tính lại ở client.
- Service/query hook riêng cho [tra cứu](./src/features/lookup/), [điểm và lịch sử](./src/features/grades/), [bảng điểm](./src/features/transcripts/), [thống kê](./src/features/statistics/). Query key có phiên, tài nguyên, ID/bộ lọc/page; request nhận AbortSignal.
- [QueryState](./src/components/feedback/QueryState.jsx) phân biệt tải lần đầu, refetch nền, lỗi đầu/lỗi làm mới; từng page có empty state. Dữ liệu cache còn hiển thị khi refetch lỗi kèm cảnh báo và nút thử lại.
- Nút **In bảng điểm** dùng trình duyệt; CSS A4 ngang ẩn sidebar, nút/bộ lọc/toast, bỏ giới hạn cuộn và cho bảng xuống trang. Đã kiểm tra print media fixture 85 dòng/10 cột, ảnh đầu/cuối và Chrome xuất PDF 7 trang. Chưa kiểm tra trực quan từng trang PDF, hộp thoại in hệ điều hành, máy in vật lý hoặc Firefox/WebKit.

## Quản trị giai đoạn 5

- Chỉ ADMIN vào `#/students` và `#/users`; route guard, menu và kiểm tra quyền backend giữ nguyên. [routeConfig](./src/app/routeConfig.js) đã đúng nên không cần đổi quyền.
- [Sinh viên](./src/features/students/): danh sách 12 dòng/trang, bộ lọc q/lớp/trạng thái trên URL; thêm/sửa bằng React Hook Form, validation tại trường, khóa form khi đang gửi. Mã SV không sửa được. Backend tự tạo user đi kèm qua POST sinh viên; UI không gọi thêm endpoint tạo user.
- [Tài khoản](./src/features/users/): danh sách 15 dòng/trang, q/role/page trên URL; khóa/mở bằng boolean `is_active`, reset mật khẩu mặc định theo vai trò. Dialog nêu đúng username/họ tên; chặn tự khóa/mở tài khoản đang đăng nhập theo backend.
- Xóa sinh viên yêu cầu xác nhận, hiển thị lỗi 409 khi đã có đăng ký/điểm. Form giữ draft khi lỗi 400/403/409 hoặc mạng; lỗi mạng ghi rõ kết quả có thể đã được xử lý và không tự retry ghi.
- [useAdminMutation](./src/features/users/useAdminMutation.js) chặn submit lặp, invalidate cache cùng phiên, không áp dụng phản hồi/toast sau logout. Mutation sinh viên làm mới students/users/transcripts/stats/grades/history; sửa/xóa làm trang cuối rỗng thì chuyển về trang hợp lệ và giữ bộ lọc.
- Backend chỉ đồng bộ tên user khi sửa hồ sơ; email hồ sơ và tài khoản có thể khác nhau. Khóa/reset không thu hồi ngay JWT cũ; giao diện không hứa điều đó.

### Kiểm thử ghi API thật (chỉ development/test đã xác định)

[admin-live.spec.js](./src/features/users/tests/browser/admin-live.spec.js) mặc định bị skip, kể cả khi bật `LIVE_AUTH=1`. Chỉ chạy sau khi xác nhận backend đích của Vite proxy là development/test:

```powershell
$env:ADMIN_TEST_ENV='development' # hoặc test, đúng môi trường đã xác định
$env:LIVE_ADMIN_WRITES='1'
try {
  npm.cmd --prefix fe-react run test:e2e -- src/features/users/tests/browser/admin-live.spec.js
} finally {
  Remove-Item Env:LIVE_ADMIN_WRITES
  Remove-Item Env:ADMIN_TEST_ENV
}
```

Test dùng ADMIN demo và TEACHER demo, tạo **một sinh viên mới** có mã `R5` + UUID và email `example.test` qua UI, kiểm tra user tạo kèm, trùng mã 409, sửa/đồng bộ tên, khóa/mở/login, reset mật khẩu và backend từ chối role khác. Chỉ đổi mật khẩu của tài khoản vừa tạo để xác minh reset thực sự có tác dụng. Xóa chính bản ghi mới qua UI và kiểm tra user cũng biến mất; nếu thất bại thì cleanup chỉ dùng ID nhận từ response 201 và mã chính xác của lượt chạy. Không seed/reset, không xóa theo prefix, không sửa bản ghi có sẵn. Test không tạo đăng ký học phần; lỗi xóa do đăng ký/điểm được kiểm tra bằng fixture.

Nếu API đã tạo dữ liệu nhưng response bị mất trước khi nhận ID, không đoán ID để xóa; cần kiểm tra thủ công mã riêng của lượt chạy. Không coi test chưa chạy hoặc skip là nghiệm thu API ghi thành công.

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

Tham khảo triển khai: [Vite](https://vite.dev/guide/), [useBlocker](https://reactrouter.com/7.18.5/api/hooks/useBlocker), [Vitest](https://vitest.dev/guide/), [native dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog).

## Nhập điểm — giai đoạn 6

- ADMIN/TEACHER mở http://127.0.0.1:5173/#/entry, chọn học kỳ → lớp học phần. Danh sách lớp và quyền thao tác do API xác định.
- [Feature nhập điểm](./src/features/grade-entry/) giữ draft theo enrollment ID; refetch không ghi đè dòng đang sửa. Lưu dòng hoặc Lưu tất cả chỉ gửi các dòng dirty qua PUT từng enrollment, không có transaction toàn bảng. Dòng lỗi giữ giá trị đã nhập và báo lỗi riêng; tổng kết/xếp loại lấy từ response chính thức.
- Chỉ cuối kỳ bắt buộc. Chuyên cần/giữa kỳ có thể trống, điểm 0 hợp lệ, phạm vi 0–10 kiểm tra trước làm tròn; dấu phẩy được chấp nhận như backend. Nếu thiếu CC hoặc GK thì tổng kết dùng CK theo quy tắc hiện hữu.
- Thêm sinh viên dùng mã SV qua endpoint enroll hiện có. Xóa điểm có xác nhận mã/tên SV/lớp, xóa lịch sử nhưng giữ enrollment theo backend. Grade ID từ response lưu được dùng ngay cho xóa/lịch sử.
- Router vẫn dùng URL hash, nhưng [App](./src/app/App.jsx) chuyển sang `createHashRouter`/`RouterProvider` để dùng `useBlocker`. Menu, Back/Forward, đổi lớp/học kỳ và đăng xuất cần xác nhận khi còn draft; đang gửi thì chờ hoàn tất. Refresh/đóng trang dùng cảnh báo native `beforeunload` của trình duyệt.
- Draft chỉ ở bộ nhớ của trang/phiên, không lưu điểm vào localStorage. Chấp nhận bỏ thay đổi, tải lại trang hoặc phiên bị thu hồi sẽ xóa draft. Trình duyệt có thể không hiện cảnh báo khi bị đóng cưỡng bức; không coi đây là cơ chế tự lưu.
- [Browser fixture](./src/features/grade-entry/tests/browser/entry.spec.js) kiểm tra mutation và bảo vệ draft. [Đối chiếu live](./src/features/grade-entry/tests/browser/entry-live.spec.js) chỉ login/GET, so sánh mọi dòng của hai lớp được chọn cho từng ADMIN/TEACHER và kiểm tra GET lớp ngoài quyền trả 403.
- **Chưa chạy lưu/xóa điểm hoặc enroll trên DB thật** do chưa xác định development/test. Để nghiệm thu, cần lớp và sinh viên thử riêng; kiểm tra lưu 0/10/thiếu thành phần, cập nhật tổng điểm tạo lịch sử, xóa điểm, enroll và 403 thao tác ghi. Không dùng hồ sơ đang sử dụng để test. API hiện không có xóa enrollment nên phải thống nhất dữ liệu thử giữ lại, không tự cleanup bằng SQL hay reset/seed.

## Import Excel — giai đoạn 7

ADMIN/TEACHER mở http://127.0.0.1:5173/#/import. [Feature import](./src/features/import/) gọi GET `/api/import/template` có Bearer token để lấy blob, tải tên `excel_template.xlsx`, rồi revoke object URL. POST `/api/import/grades` dùng FormData field `file`; browser tự đặt multipart boundary. Không đọc/parse workbook trong ứng dụng React và không thêm thư viện Excel vào bundle.

- Picker/validation giữ `.xlsx,.xls` như baseline; không chặn theo MIME vì backend không có filter MIME/extension. Backend vẫn kiểm tra nội dung, sheet đầu, 4 cột bắt buộc và 5.000 dòng. Frontend chỉ chặn file thiếu, 0 byte, đuôi không phù hợp và dung lượng bị từ chối.
- Multer cấu hình `5 * 1024 * 1024`; Busboy đang cài phát `LIMIT_FILE_SIZE` khi **đạt** giới hạn. Đã xác minh bằng middleware local cô lập, không gọi controller/DB: 5.242.879 byte nhận, 5.242.880 và 5.242.881 byte bị từ chối. UI vì thế yêu cầu file **nhỏ hơn 5 MiB**, không đổi backend.
- Upload khóa file/nút khi pending, chống gửi trùng và không tự retry. Hiển thị tên file, trạng thái đang xử lý, không có phần trăm tiến độ giả. Kết quả giữ tên file đã gửi kể cả khi chọn file mới.
- [ImportLeaveGuard](./src/features/import/ImportLeaveGuard.jsx) giữ màn hình khi menu/Back hoặc đăng xuất chủ động trong lúc upload đang xử lý; dialog cho ở lại đọc kết quả. Refresh/đóng tab có beforeunload. Mất phiên hoặc buộc rời trang không chứng minh server đã hủy các dòng đã commit.
- Hiển thị nguyên total/created/updated/failed và row/message từ response; phân biệt toàn bộ thành công, thành công một phần, tất cả dòng lỗi và request thất bại. Tổng lỗi dùng `failed`; khi bị cắt, ghi rõ chỉ có tối đa 100 chi tiết lỗi đầu tiên. Bảng lỗi cuộn dọc, đọc được trên mobile.
- Import cập nhật điểm cuối kỳ/tổng kết và **xóa CC/GK cũ**; mỗi dòng commit riêng. Giao diện nêu rõ trước khi gửi. Không tự tính điểm hoặc chọn lớp thay backend.
- Khi created+updated>0, invalidate offering-students/grades/transcripts/grade-history/stats/offerings cùng session; không invalidation users/students/meta vì không thay đổi hồ sơ/danh mục. Với mất mạng, HTTP 5xx/408 hoặc response thành công không đúng cấu trúc, báo **chưa xác định kết quả**, làm mới cache có thể bị ảnh hưởng và yêu cầu kiểm tra dữ liệu trước khi gửi lại; không đoán số dòng đã lưu.
- Tải mẫu thật ADMIN/TEACHER và GET STUDENT bị từ chối đã đạt. Các POST import trong test đều được mock/intercept. **Chưa chạy upload vào DB thật** do môi trường development/test chưa được xác định; không coi test fixture là nghiệm thu transaction/quyền import thật.
- Hạn chế backend B02 trong [baseline](../docs/react-migration-baseline.md) vẫn còn: TEACHER thiếu hồ sơ teacher có thể không bị lọc lớp khi import. Đề xuất backend từ chối trường hợp này là công việc riêng; không vá quyền bằng lọc client.

Kiểm tra riêng browser import (fixture mặc định; thêm LIVE_AUTH=1 chỉ bật tải mẫu/GET thật):

```powershell
npm.cmd --prefix fe-react run test:e2e -- src/features/import/tests/browser/import.spec.js
```

Tham khảo giai đoạn 3: [TanStack Query cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation), [QueryClient](https://tanstack.com/query/latest/docs/framework/react/reference/classes/QueryClient), [React Hook Form](https://react-hook-form.com/docs/useform).

Xem [baseline](../docs/react-migration-baseline.md), [kế hoạch](../docs/ke-hoach-chuyen-frontend-react.md) và [nhật ký](../docs/react-migration-progress.md) để đối chiếu ma trận C01–C21; cần hoàn tất kiểm thử ghi thật và xử lý riêng B02 trước khi nghiệm thu toàn bộ.
