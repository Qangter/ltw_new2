# Nhật ký chuyển frontend sang React

## Trạng thái hiện tại

Cập nhật: 04/11/2026.

| Giai đoạn | Trạng thái | Ghi chú |
|---|---|---|
| 1 — Khảo sát/hợp đồng | Hoàn thành khảo sát và tài liệu | [Baseline](./react-migration-baseline.md); chưa nghiệm thu tích hợp ứng dụng |
| 2 — Khởi tạo/component | Hoàn thành | Khung React, 25 component/route tests, 6 E2E, proxy API thật; xem mục bàn giao dưới |
| 3 — Auth/API/quyền | Hoàn thành triển khai và kiểm tra phạm vi giai đoạn | 46 tests, 14 E2E (5 backend thật); đổi mật khẩu ghi DB chỉ kiểm thử fixture, giữ kiểm tra tài khoản test riêng ở bàn giao |
| 4 — Trang đọc | Chưa bắt đầu | Theo baseline route/API |
| 5 — Quản trị | Chưa bắt đầu | Không đổi backend/schema |
| 6 — Nhập điểm | Chưa bắt đầu | Ưu tiên chính xác dữ liệu và draft |
| 7 — Import | Chưa bắt đầu | Lưu từng dòng, tối đa 100 lỗi trong response |
| 8 — Kiểm thử/chuyển đổi | Chưa bắt đầu | Chưa chuyển Express sang React |

Trạng thái trong nhật ký này là nguồn tiến độ hiện hành. Câu “tất cả giai đoạn chưa thực hiện” trong [kế hoạch ban đầu](./ke-hoach-chuyen-frontend-react.md) mô tả thời điểm lập kế hoạch, không thay thế nhật ký.

## Giai đoạn 1 — 03/11/2026

### Phạm vi và quyết định

- Người dùng gửi Prompt chung và kế hoạch nhưng không ghi số giai đoạn. Vì chưa có nhật ký hoặc frontend React, bắt đầu giai đoạn 1; đã thông báo giả định này trước khi khảo sát.
- Chỉ đọc code và tạo tài liệu; không thực hiện giai đoạn 2, không cài dependency, không tạo khung React, không sửa ứng dụng, không commit/push/deploy.
- Giữ nguyên các thay đổi có sẵn: [kế hoạch](./ke-hoach-chuyen-frontend-react.md) và [nội dung thuyết trình](./noi-dung-thuyet-trinh-du-an-15-slide.md) đang untracked từ trước.
- Không tìm thấy AGENTS.md ở root và trong phạm vi fe/be/docs/database đã kiểm tra, bỏ qua node_modules.

### Hoàn thành

- Kiểm kê 12 route giao diện, 27 endpoint; ghi input, response, lỗi, giới hạn, phân trang và ma trận ADMIN/TEACHER/STUDENT.
- Đối chiếu frontend với route/controller/model/service và schema, không chỉ dựa README.
- Chốt nghiệp vụ điểm 0/bỏ trống, công thức CC/GK/CK, làm tròn, xếp loại, GPA thang 10 theo tín chỉ, lịch sử khi tổng điểm đổi.
- Ghi rõ import transaction từng dòng, 4 cột bắt buộc trong 8 cột mẫu, CC/GK bị đặt null, errors chỉ tối đa 100 dòng.
- Đề xuất ánh xạ component/hook/page, cách chia state và invalidation theo tác động dữ liệu.
- Lập 21 kịch bản nghiệm thu C01–C21, tách lỗi frontend F01–F08 và đề xuất backend B01–B04.

### File thay đổi

| File | Thay đổi |
|---|---|
| [react-migration-baseline.md](./react-migration-baseline.md) | Tạo mới tài liệu hợp đồng và checklist |
| [react-migration-progress.md](./react-migration-progress.md) | Tạo mới nhật ký này |

Không chỉnh [fe](../fe/), [be](../be/), [database](../database/) hoặc tài liệu có sẵn.

### Kiểm tra và kết quả

1. `git status --short`: xác định 2 tài liệu untracked trước khi sửa; không có thay đổi tracked tại thời điểm bắt đầu.
2. Đọc mã nguồn và liệt kê `router.get/post/put/patch/delete`: xác minh đủ 27 endpoint, 12 route màn hình tính cả login.
3. `node --version`: v22.19.0; `npm.cmd --version`: 10.9.3.
4. Script assertion đưa qua stdin vào `node`, import [utils/grade](../be/utils/grade.js): **24/24 đạt** cho optional blank/null, điểm 0, dấu phẩy, làm tròn, lỗi 400, tổng có/thiếu thành phần và ngưỡng chữ.
5. Lần thử đầu bằng `node -e` lỗi quoting PowerShell trước khi chạy assertion; đã đổi sang stdin và chạy thành công. Không tính lần đầu là test đạt.
6. `Invoke-WebRequest -Uri http://localhost:3000/api/auth/me -UseBasicParsing -TimeoutSec 5`: **không kết nối được**, không có HTTP status. Chưa xác minh API/MySQL thật; không đoán lỗi server hoặc cổng khác.
7. Lint/build ứng dụng: **không chạy, không áp dụng cho thay đổi chỉ Markdown**; frontend React chưa có, backend không có script lint/build/test.
8. Kiểm tra tài liệu bằng script Node qua stdin: **2 tài liệu, 74 liên kết nội bộ hợp lệ**; tập 27 endpoint trong baseline khớp chính xác method/path trích từ routes; đủ 12 route màn hình và 21 kịch bản. Không có ký tự thay thế Unicode, trailing whitespace hoặc code fence không đóng.
9. VS Code Problems: không báo lỗi ở hai tài liệu. `git diff --exit-code -- fe be database README.md` đạt, chứng minh các nguồn ứng dụng được theo dõi không đổi; `git diff --check` đạt. Kiểm tra riêng nội dung hai file mới ở mục 8 vì git diff thông thường không kiểm tra file untracked.

### Hạn chế và phát hiện cần giữ khi bàn giao

- Các bảng API/quyền được xác minh tĩnh, không phải đã chạy request với từng tài khoản.
- Chưa chạy browser/print preview, chưa xác minh MySQL/seed thực tế; không nhập, xóa, reset hoặc sửa dữ liệu.
- Backend không thu hồi JWT hiện hành khi khóa/reset mật khẩu (B01); import có nhánh thiếu hồ sơ teacher cần xem xét riêng (B02). Không sửa backend theo yêu cầu giữ phạm vi.
- Giữ quyền T đọc dữ liệu toàn hệ thống nhưng chỉ ghi lớp riêng; không tự biến quyền đọc thành quyền riêng lớp.
- Bản cũ có lỗi empty state bị xóa, listener bảng điểm gắn lặp, không cập nhật grade ID sau tạo và không bảo vệ draft. React cần xử lý theo giai đoạn phù hợp, không sao chép nguyên DOM cũ.

### Cách xem và điều kiện chuyển tiếp

- Mở [baseline](./react-migration-baseline.md) bằng Markdown Preview để xem hợp đồng, mapping và checklist; giai đoạn này không có giao diện React để chạy thử.
- **Đủ điều kiện sang giai đoạn 2:** đã hoàn thành kiểm kê và tài liệu. Không yêu cầu mọi smoke test tích hợp phải đạt mới được dựng khung; các kiểm tra chưa chạy phải được giữ trong checklist.
- Việc tiếp theo: đọc kế hoạch + baseline + nhật ký; tạo frontend React độc lập với JavaScript/JSX và HashRouter, cấu hình proxy, tái sử dụng CSS/logo, xây component chung. Chưa thay static middleware Express.
- Không tự bắt đầu giai đoạn 2 trong lượt công việc này.

## Giai đoạn 2 — 03/11/2026

### Phạm vi và quyết định

- Thực hiện đúng 8 yêu cầu giai đoạn 2. Đã đọc kế hoạch, baseline, nhật ký, hướng dẫn repository và git status trước khi sửa.
- Tạo [fe-react](../fe-react/) độc lập; giữ nguyên code [fe](../fe/), [be](../be/), [database](../database/) và README gốc. Các tài liệu có sẵn khác không bị ghi đè.
- Dùng React 19.3.1, React Router 7.18.5, Vite 8.3.5/plugin-react 6.2.1, Vitest 5.1.0; JavaScript/JSX, HashRouter. Phiên bản chính xác cùng dependency tree được lưu trong lockfile.
- Node thực tế 22.19.0, npm 10.9.3. engines frontend đặt `^22.13.0 || ^24.0.0 || >=26.0.0` theo yêu cầu chung của công cụ đã chọn. ESLint 9 ban đầu được thay bằng ESLint 10 sau khi xác minh plugin hỗ trợ vì npm đánh dấu bản 9 hết hỗ trợ.
- Chưa tạo AuthProvider, API client hay QueryClientProvider; các phần này thuộc giai đoạn 3. Không cài TanStack Query/React Hook Form khi chưa dùng, không tạo token/user giả.
- Sidebar ở chế độ xem trước hiển thị danh mục route, có thông báo chưa phân quyền. Metadata role và prop role sẵn cho bước sau, không phải kiểm soát truy cập runtime.

### Hoàn thành

- Đủ 12 route hash cũ, page riêng theo feature; login, root redirect, bảng điểm chi tiết và trang không tồn tại. Các page nghiệp vụ chỉ có tên/trạng thái/chỉ dẫn giai đoạn, không fetch hoặc sửa dữ liệu.
- Cấu trúc app/components/features/services/hooks/utils/styles; App chỉ ghép router/providers. Services hiện có hướng dẫn cho giai đoạn tiếp theo, không có endpoint giả.
- Component AppLayout, Sidebar, Card, Badge, Pagination, EmptyState, Loading, ErrorState, ToastProvider/useToast, Modal và ConfirmDialog.
- Modal native dialog + portal: nhãn/description, focus ban đầu, Tab/Shift+Tab, Escape, trả focus và khôi phục body scroll. ConfirmDialog focus vào Hủy; pending chặn gửi lặp/đóng; error và việc đóng do parent quản lý.
- Toast nhiều thông báo đồng thời, nút đóng, timeout, tạm dừng khi hover/focus. Pagination không xóa empty state và không tạo hàng nghìn nút khi nhiều trang.
- Import CSS/logo nguyên gốc qua Vite; CSS bổ sung cho React, focus, tương phản badge, responsive và print. Không fetch template hoặc chạy JS DOM cũ.
- Trang dev-only `#/__components` dùng danh mục component thật để thử bảng, toast, modal và trạng thái; không tạo dữ liệu SV/điểm giả. Không có route/link preview này trong production build.
- Proxy `/api` tới backend qua cấu hình API_PROXY_TARGET; script check:proxy dùng request read-only thật. Không sửa static middleware Express.
- Có dev/build/preview/lint/test/test:watch/test:e2e/check:proxy, lockfile, gitignore và hướng dẫn chạy/kiểm tra.

### File thay đổi chính

| File/thư mục | Nội dung |
|---|---|
| [package.json](../fe-react/package.json), [lockfile](../fe-react/package-lock.json) | Scripts, dependency và phiên bản khóa |
| [Vite config](../fe-react/vite.config.js), [ESLint config](../fe-react/eslint.config.js), [Playwright config](../fe-react/playwright.config.js) | Build/dev/proxy, lint, test |
| [app](../fe-react/src/app/), [features](../fe-react/src/features/) | Router/providers và page placeholder theo feature |
| [components](../fe-react/src/components/), [hooks](../fe-react/src/hooks/), [utils](../fe-react/src/utils/) | Thành phần dùng chung và test tương ứng |
| [styles](../fe-react/src/styles/), [test setup](../fe-react/src/test/setup.js), [e2e](../fe-react/e2e/) | Style tương thích và kiểm thử |
| [check-proxy](../fe-react/scripts/check-proxy.mjs) | Kiểm tra hai frontend và proxy API thật, không ghi DB |
| [README frontend](../fe-react/README.md), [.env.example](../fe-react/.env.example) | Cách chạy, cấu hình, giới hạn giai đoạn |
| [VS Code tasks](../.vscode/tasks.json) | Tạo mới task build/dev/preview React và start backend cũ |
| [Nhật ký này](./react-migration-progress.md) | Cập nhật giai đoạn 2 và bàn giao |

### Kiểm tra thực tế

Lệnh dưới chạy từ root với `npm.cmd --prefix fe-react ...`, hoặc trong thư mục frontend bỏ `--prefix fe-react`.

| Kiểm tra/lệnh | Kết quả |
|---|---|
| Node/npm và engine npm registry | Xác minh tương thích Node 22.19.0; dependency cài thành công |
| `npm.cmd run lint` | Đạt, không warning |
| `npm.cmd test` | **25/25 đạt** ở 4 file; route placeholders không tự gọi fetch, menu metadata 3 role, phân trang rỗng/giới hạn, toast, modal lifecycle/pending/error |
| `npm.cmd run test:e2e` | **6/6 đạt**, Chrome thật; hash deep-link/refresh/Back, logo, không tự gọi API, modal focus/Tab/Shift+Tab/Escape/restore, confirm/toast, viewport 360/768/1280px |
| Kiểm tra ảnh viewport | Đã xem screenshot mobile 360 và desktop 1280; không tràn ngang toàn trang; bảng và menu có scroll riêng. Test kiểm tra thêm 768px |
| `npm.cmd run build` / task React: build | Đạt; dist chứa HTML/CSS/JS/logo, không cần frontend cũ lúc chạy build output |
| `npm.cmd run preview` | Đã mở build tại 4173; dashboard placeholder hiển thị, route `#/__components` trả trang không tìm thấy và không có link dev trong sidebar |
| `npm.cmd run check:proxy` | Đạt trên backend thật đã khởi động: frontend cũ và React trả 200; /api/auth/me trực tiếp/qua proxy đều 401 JSON; API lạ đều 404 JSON |
| VS Code Problems | Không báo lỗi frontend |
| Lockfile/doc links | Lock root dependencies/devDependencies/engines khớp package.json; 25 link local trong README/services README hợp lệ tại lần kiểm tra |
| `git diff --exit-code -- fe be database README.md` | Đạt: nguồn ứng dụng cũ không thay đổi |
| `npm.cmd audit --omit=dev` | 0 lỗ hổng được báo |
| `npm.cmd audit` | Còn 6 cảnh báo moderate trong chuỗi dev ESLint/minimatch; không có high/critical; không dùng force upgrade hoặc override major |

Diễn biến kiểm tra cần lưu để không nhầm kết quả:

- VS Code Test Explorer chưa discover các test mới; đã dùng script Vitest thực, không coi “No tests matched” là test đạt.
- Test đầu phát hiện aria-current không giữ active cho tra cứu khi vào student/:id; đã sửa Sidebar và kiểm tra lại đạt.
- E2E tiếp theo phát hiện selector text quá rộng khớp cả banner và placeholder; đã dùng exact text. Không bỏ assertion.
- Hai lượt E2E trong sandbox đã chạy các case nhưng bị treo ở kết thúc tiến trình; đã dừng các lượt đó, không tính là full pass. Lượt chạy ngoài sandbox sau phê duyệt kết thúc exit 0, 6/6 đạt.
- Kiểm tra danh sách process bằng CIM từng bị sandbox từ chối; không dùng kết quả đó để kết luận ứng dụng lỗi. Việc quản lý chạy/dừng chính qua task và session của công cụ.

### Cách xem thử và trạng thái server

- React dev đang chạy: http://127.0.0.1:5173/#/dashboard
- Component preview dev: http://127.0.0.1:5173/#/__components
- Bản build preview đang chạy: http://127.0.0.1:4173/#/dashboard
- Backend/frontend cũ đang chạy qua task riêng: http://localhost:3000
- Dừng task khi không cần bằng VS Code Tasks: Terminate Task hoặc Ctrl+C ở terminal tương ứng. E2E dùng cổng 5180 riêng, không phải frontend người dùng.

### Giới hạn và bàn giao giai đoạn 3

- **Đủ điều kiện sang giai đoạn 3.** Giai đoạn 2 hoàn thành nền tảng, không đánh dấu các tính năng login/bảng điểm/CRUD/import là hoàn chỉnh.
- API thật mới kiểm tra các request không xác thực và frontend static; chưa kiểm tra login/role hoặc dữ liệu nghiệp vụ. Không có thao tác ghi database, reset hoặc seed.
- Auth Context, route guard, khôi phục token, xử lý 401/403, API client và TanStack Query cần thực hiện ở giai đoạn 3. Sidebar preview phải được thay bằng menu theo phiên đã xác minh trước khi hiển thị dữ liệu thật.
- Chỉ kiểm tra Chrome/Chromium hiện có, chưa kiểm tra Firefox/WebKit hoặc trình duyệt cũ không hỗ trợ dialog. Nội dung in bảng điểm thật sẽ kiểm tra khi chuyển trang ở giai đoạn 4/8; hiện chỉ có nền CSS.
- 6 cảnh báo dependency dev đã nêu; không tuyên bố toàn bộ dependency sạch. Logo gốc khoảng 1 MB được giữ nguyên, chưa tối ưu tài sản ngoài phạm vi yêu cầu.
- Express vẫn phục vụ frontend cũ. Không commit, push hoặc deploy; không tự bắt đầu giai đoạn 3.

## Giai đoạn 3 — 04/11/2026

### Phạm vi và quyết định

- Đọc kế hoạch, baseline, nhật ký giai đoạn 2, code auth/backend/router, git status và hướng dẫn repository trước khi sửa. Giữ nguyên các tài liệu/changes có sẵn, gồm tài liệu thuyết trình; không sửa [fe](../fe/), [be](../be/), [database](../database/) hoặc README gốc.
- Node 22.19.0/npm 10.9.3; thêm đúng TanStack Query **5.105.3** và React Hook Form **7.91.0**, phiên bản exact và lockfile. Không thêm axios, schema validator, store hoặc UI library khác.
- Auth session là external store được Auth Context kết nối qua useSyncExternalStore. Tách khỏi component để kiểm thử race/cancel độc lập; tương thích StrictMode setup/cleanup. Không thay hợp đồng API.
- Chọn QueryClient riêng mỗi phiên thay vì chỉ invalidate cache chung. Abort/cancel/clear chạy trước khi công bố phiên mới; API client giữ token và signal của chính phiên đó, không lấy token mới giữa request.
- Không tin login response user hoặc user/role trong localStorage để mở route: luôn xác minh `/me`, cả lúc khởi động lẫn sau login. Giữ tên key token/user tương thích bản cũ; origin/cổng dev khác nhau có storage riêng.

### Chức năng hoàn thành

- Fetch client: Bearer token, JSON, FormData tự boundary, blob, query parameters (giữ 0/false, bỏ null/undefined), AbortSignal, lỗi có HTTP status và JSON message. Không nhận URL ngoài `/api/` cùng origin. Không dùng HTML từ API hoặc dangerouslySetInnerHTML.
- Ba trạng thái xác thực: verifying/anonymous/authenticated. Trang bảo vệ chỉ render sau `/me` hợp lệ. Storage JSON user hỏng không crash/không cấp quyền; storage bị chặn vẫn cho phiên trong tab với cảnh báo không lưu được.
- 401 từ request có token hủy phiên, xóa token/user, hủy request/cache và báo hết hạn; 401 login báo sai thông tin. 403 giữ phiên và hiển thị lỗi thiếu quyền. `/me` lỗi mạng/5xx/403 giữ token nhưng vẫn chặn page; có thử lại hoặc quay lại đăng nhập.
- Login bằng React Hook Form, giữ input khi lỗi, khóa khi pending; quay lại deep link đúng quyền hoặc về home theo role. Sidebar dùng user/role server; guard trực tiếp URL trái quyền hiển thị 403. Logout đồng bộ tab khác qua storage event.
- Đổi mật khẩu: validation bắt buộc/tối thiểu 6 ký tự/xác nhận khớp, payload old_password/new_password; không gửi confirm. Lỗi giữ draft; pending chặn input/gửi lặp; thành công reset và toast. Không tự đổi token/logout vì backend không quy định điều đó.
- Query key chứa session/resource/list hoặc detail/ID/đầy đủ query params. Query đọc retry giới hạn 2 lần, không retry 4xx/AbortError; mutation retry false và không xếp hàng ghi offline. Login/verify/client không tự retry.
- Request cũ kể cả 401 hoặc mutation success trả muộn không được thay phiên mới hoặc hiện toast cũ. Logout/đổi tài khoản xóa cả query cache và mutation cache, remount cây UI riêng tư/draft/toast.
- Vẫn giữ toàn bộ route nghiệp vụ giai đoạn 4–7 là placeholder thật sự; chỉ auth/password đã kết nối. Không lấy dữ liệu điểm, tính GPA hay thêm nghiệp vụ.

### File thay đổi chính

| File/thư mục | Nội dung |
|---|---|
| [apiClient](../fe-react/src/services/apiClient.js), [API tests](../fe-react/src/services/apiClient.test.js) | Fetch client và kiểm tra hợp đồng/cancel |
| [auth feature](../fe-react/src/features/auth/) | AuthProvider/context/hook, session store/storage, guard, login/password và session tests |
| [app](../fe-react/src/app/) | Providers/router, role metadata, QueryClient/keys, route/form tests |
| [layout](../fe-react/src/components/layout/), [CSS](../fe-react/src/styles/index.css) | Menu/user/logout theo quyền và style form |
| [test fixtures](../fe-react/src/test/authFixtures.js), [E2E auth](../fe-react/e2e/auth.spec.js), [foundation tests](../fe-react/e2e/foundation.spec.js) | Fixture tách biệt và smoke thật opt-in |
| [Playwright config](../fe-react/playwright.config.js), [Vite config](../fe-react/vite.config.js) | 2 workers, mode/cache E2E riêng tránh đụng cache dev |
| [package](../fe-react/package.json), [lockfile](../fe-react/package-lock.json) | Hai dependency cần cho giai đoạn |
| [README React](../fe-react/README.md), [services guide](../fe-react/src/services/README.md), [nhật ký](./react-migration-progress.md) | Cách chạy, sử dụng auth/query, kiểm tra và giới hạn |

### Kiểm tra đã chạy

Lệnh chạy trong thư mục frontend hoặc từ root thêm `--prefix fe-react` sau npm.cmd.

| Lệnh/kiểm tra | Kết quả |
|---|---|
| `npm.cmd run lint` | Đạt, không warning |
| `npm.cmd test` | **46/46 đạt**, 6 file, gồm client JSON/FormData/blob/abort/status; restore/storage hỏng/network/401/403; stale request/restore; query cancellation/cache logout; role/menu/deep link; login/password validation/draft/gửi lặp/stale mutation; regression UI giai đoạn 2 |
| `npm.cmd audit --omit=dev` | 04/11/2026: 0 lỗ hổng runtime được báo; không đồng nghĩa toàn bộ dev dependency sạch |
| `$env:LIVE_AUTH='1'; npm.cmd run test:e2e` | **14/14 đạt**, Chrome thật: 9 ca fixture + 5 ca backend thật; không mock các ca live |
| 5 ca live qua Vite proxy | ADMIN, TEACHER, STUDENT login + `/me` + reload + logout; guard URL và GET admin 403 với role không phải admin; sai password trả lỗi; token không hợp lệ bị `/me` từ chối và xóa khỏi storage |
| Fixture browser | Password success chỉ ghi vào route mock; logout giữa hai tab, token hết hạn + corrupt user, modal keyboard/focus, responsive sidebar/table 360/768/1280, hash/Back/logo |
| `npm.cmd run build` / React: build | Đạt, 106 modules, JS khoảng 338 kB trước gzip; giữ logo/CSS cũ |
| `npm.cmd run preview` | Mở build tại 4173; login STUDENT với API thật về bảng điểm placeholder, đúng menu, không có link dev; logout trở lại login. Chưa đổi static Express |
| `npm.cmd run check:proxy` | Đạt: legacy/React HTTP 200; `/api/auth/me` 401 và API lạ 404 JSON không đổi qua proxy |
| VS Code Problems | Không báo lỗi frontend |
| `git diff --exit-code -- fe be database README.md` | Đạt, nguồn ứng dụng cũ không đổi |
| Xem ảnh kiểm tra | Đã xem password desktop và login mobile; form trong viewport, nhãn rõ, không tràn ngang. Ảnh mobile ban đầu chụp giữa animation CSS cũ; cấu hình chụp đã chuyển sang kết thúc animation trước khi lưu |

Diễn biến test được giữ để không nhầm với lần chạy đạt:

- Lần đầu 8 Chrome workers: 8 đạt/4 lỗi, gồm timeout và assertion logo đọc quá sớm. Giảm về 2 worker, dùng expect.poll chờ ảnh thực sự tải; không bỏ assertion hoặc thêm retry.
- Lần kế tiếp 11 đạt/1 lỗi lazy-load component gallery khi khởi động dev song song: hai Vite dùng chung optimized-dependency cache. Tách mode/cache E2E khỏi dev; chạy lại toàn bộ đạt 12/12, sau đó bổ sung cross-tab + invalid token thật và đạt 14/14.
- npm cài đặt/audit và Chrome cần truy cập ngoài sandbox sau phê duyệt. Không coi lỗi môi trường là test đạt.
- Không reset/seed/delete DB và **không gửi request đổi mật khẩu thành công tới backend thật**. Các tài khoản demo thật chỉ dùng login/GET; không thay thông tin tài khoản.

### Giới hạn và chuyển giao

- **Đủ nền tảng sang giai đoạn 4**: API client/auth/guard/query keys và cache isolation đã có, ba role đã kiểm tra với API thật. Dừng tại giai đoạn 3, không tự chuyển trang đọc.
- Còn kiểm tra đổi mật khẩu end-to-end thật (success rồi đăng nhập bằng mật khẩu mới) trên tài khoản test riêng được xác định; hiện chỉ đã kiểm tra payload/validation/error/success/reset bằng mock. Không tuyên bố nghiệm thu ghi DB cho chức năng này.
- Backend giữ nguyên hạn chế đã nêu ở baseline: JWT 8h không bị thu hồi khi khóa/reset mật khẩu, `/me` không kiểm tra is_active. Không thể bảo đảm revocation tức thời bằng frontend; đề xuất backend riêng nếu cần, không sửa trong giai đoạn này.
- Không có refresh token; hết hạn được xử lý khi `/me` hoặc API trả 401, không tự retry/refresh token. Token localStorage giữ tương thích nên vẫn có rủi ro nếu origin bị XSS; chưa đổi kiến trúc cookie.
- Chưa kiểm tra Firefox/WebKit, không dùng kết quả Chrome thay cho mọi trình duyệt. Chưa có dữ liệu thật/loading nền/refetch cho trang nghiệp vụ; giai đoạn 4 phải dùng hướng dẫn query, không ghi đè draft.
- Installer vẫn báo 6 moderate trong toàn bộ dependency tree (cảnh báo dev đã ghi giai đoạn 2); không force upgrade/override. Không tự nâng backend dependency.

### Chạy/xem và bàn giao

```powershell
npm.cmd --prefix be start
# Terminal khác:
npm.cmd --prefix fe-react run dev
```

- Dev http://127.0.0.1:5173/#/login; build preview http://127.0.0.1:4173/#/login; frontend cũ http://localhost:3000. Backend/dev/preview đang chạy bằng các task tương ứng, có thể dừng trong VS Code Tasks: Terminate Task.
- Đọc [services guide](../fe-react/src/services/README.md) trước khi viết hook giai đoạn 4: lấy api/sessionId qua useAuth, truyền signal từ queryFn, key chứa đủ params, tách loading đầu/refetch/empty/error. Không tạo fetch/token singleton ngoài phiên.
- Không commit, push, deploy; không chỉnh Express static hoặc dữ liệu/schema/quyền backend.
