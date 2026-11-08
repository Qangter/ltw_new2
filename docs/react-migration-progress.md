# Nhật ký chuyển frontend sang React

## Trạng thái hiện tại

Cập nhật: 06/11/2026.

| Giai đoạn | Trạng thái | Ghi chú |
|---|---|---|
| 1 — Khảo sát/hợp đồng | Hoàn thành khảo sát và tài liệu | [Baseline](./react-migration-baseline.md); chưa nghiệm thu tích hợp ứng dụng |
| 2 — Khởi tạo/component | Hoàn thành | Khung React, 25 component/route tests, 6 E2E, proxy API thật; xem mục bàn giao dưới |
| 3 — Auth/API/quyền | Hoàn thành triển khai và kiểm tra phạm vi giai đoạn | 46 tests, 14 E2E (5 backend thật); đổi mật khẩu ghi DB chỉ kiểm thử fixture, giữ kiểm tra tài khoản test riêng ở bàn giao |
| 4 — Trang đọc | Đã bàn giao | Đối chiếu legacy/API thật, xem kết quả ngày 05/11 bên dưới |
| 5 — Quản trị | Code và fixture đạt; chưa nghiệm thu ghi thật | Chờ xác định môi trường development/test |
| 6 — Nhập điểm | Đã triển khai, fixture và đối chiếu đọc thật đạt | 117 component tests; 31 E2E fixture + 10 E2E chỉ đọc thật đạt qua các lượt; còn kiểm thử ghi thật |
| 7 — Import | Đã triển khai, fixture và tải mẫu thật đạt | 143 component tests; 36 E2E fixture + 13 live chỉ đọc/tải mẫu đạt qua các lượt; chưa nghiệm thu upload DB thật |
| 8 — Kiểm thử/chuyển đổi | Đã triển khai và kiểm tra production/rollback; chưa nghiệm thu toàn bộ | 143 component tests, 47 production E2E đạt (1 ghi thật skip), 6 dev E2E đạt, 3 static tests và 1 rollback Express thật đạt; còn ghi DB thật giai đoạn 5–7 và B02 |

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

## Rà soát giai đoạn 1–5 — 04–05/11/2026

### Phạm vi và hiện trạng

- Theo yêu cầu kiểm tra lại đến giai đoạn 5; không triển khai giai đoạn 6–8 và chưa sửa code ứng dụng trong lượt review này. Đã đọc kế hoạch, baseline, nhật ký, README, cấu hình test, code React và controller/model liên quan. Không tìm thấy AGENTS.md trong repository khi khảo sát.
- Git status ban đầu đã có 6 file modified và nhiều file untracked thuộc thống kê/quản trị/test. Giữ nguyên các thay đổi đó. File nguồn được sửa bởi lượt review này chỉ là nhật ký này.
- Code hiện có các trang đọc giai đoạn 4 và quản trị giai đoạn 5, nhưng nhật ký triển khai trước mục này và [README React](../fe-react/README.md) vẫn dừng ở giai đoạn 3. Không có bằng chứng bàn giao riêng giai đoạn 4–5 trong nhật ký cũ; mục này ghi kết quả review, không suy diễn lịch sử triển khai.

### Phát hiện cần sửa

1. **P1 — Đổi bộ lọc danh sách điểm làm nhân đôi form.** Trong [GradeListPage.jsx](../fe-react/src/features/grades/GradeListPage.jsx), dòng 16–17, hai sibling `GradeFilters` và `GradeResults` cùng dùng `key={formKey}`. Probe Chrome với fixture: mở `#/grades` có 1 `form.read-filters`; nhập `SVTEST` vào `#grades-q`, submit sang `#/grades?q=SVTEST` thì có **2 form và 2 input `#grades-q`**, cùng 4 thông báo duplicate key. Đây là lỗi chức năng đã tái hiện, không chỉ cảnh báo console. Hướng sửa: phân biệt key bằng prefix theo component hoặc đặt cả cặp dưới một Fragment có key; bổ sung regression test đổi lọc/phân trang/Back nhiều lần và khẳng định chỉ có một form, không duplicate ID.
2. **P2 — Selector E2E chặn đối chiếu API thật.** [read-pages.spec.js](../fe-react/e2e/read-pages.spec.js), dòng 120 và 149, chọn `.pager button[data-page="2"]` nên khớp cả nút số 2 và nút kế tiếp, gây strict-mode violation cho ADMIN/TEACHER. Các selector `#t-body tbody tr` ở phần bảng điểm (gồm dòng 194) đếm cả hàng tiêu đề được browser bọc trong tbody: STUDENT thực tế có 30 dòng điểm nhưng selector đếm 35 vì thêm 5 hàng tiêu đề học kỳ. Hướng sửa: chọn chính xác nút số trang; dùng `#t-body tbody[data-f="rows"] > tr` cho dữ liệu bảng điểm cũ. Sau đó chạy lại toàn bộ đối chiếu; chưa thể kết luận toàn bộ parity đạt.
3. **P2 — Lệnh E2E mặc định bỏ sót test quản trị/thống kê.** [playwright.config.js](../fe-react/playwright.config.js) chỉ discover `./e2e`, trong khi 12 ca browser riêng nằm ở [tests quản trị](../fe-react/src/features/users/tests/browser/) và [tests thống kê](../fe-react/src/features/statistics/tests/browser/). `npm run test:e2e` hiện chỉ chạy 20 ca, không chạy 12 ca này. Hướng sửa: tích hợp discovery/config hoặc thêm script tổng hợp được tài liệu hóa để lệnh kiểm tra đầy đủ không bỏ sót giai đoạn 5.
4. **Tài liệu/nghiệm thu còn thiếu:** README vẫn nói giai đoạn 4–7 là placeholder; số lượng test/cách chạy chưa cập nhật. Chưa có nghiệm thu CRUD/khóa/mở/reset/đổi mật khẩu thành công bằng API thật trên dữ liệu test riêng đã xác định. Không dùng kết quả fixture để đánh dấu phần này hoàn thành.

### Kiểm tra thực tế

Lệnh npm dưới chạy từ root, trừ hai lệnh cấu hình browser riêng chạy trong `fe-react`.

| Lệnh/kiểm tra | Kết quả |
|---|---|
| `npm.cmd --prefix fe-react run lint` | Đạt, không lỗi/warning ESLint |
| `npm.cmd --prefix fe-react test` | **89/89 đạt**, 12 file; transport fixture/mock, không chứng minh ghi DB thật |
| Task `React: build` (`npm.cmd --prefix fe-react run build`) | Đạt, 149 modules; JS khoảng 384.13 kB, gzip 120.54 kB |
| `npm.cmd --prefix fe-react run check:proxy` | Đạt: hai frontend HTTP 200, `/api/auth/me` 401 và API lạ 404 JSON được giữ qua proxy |
| `$env:LIVE_AUTH='1'; npm.cmd --prefix fe-react run test:e2e` | Lượt ngoài sandbox kết thúc exit 1: **17 đạt / 3 lỗi**. 12 ca fixture và 5 ca auth thật đạt; 3 ca live parity thất bại vì selector như trên. Có cảnh báo duplicate key |
| `npm.cmd run test:e2e -- --config src/features/users/tests/browser/playwright.config.js` | **6/6 đạt**, Chrome; fixture CRUD, validation/lỗi, dialog/pending, xóa trang cuối, quyền và responsive 360/1280px |
| `npm.cmd run test:e2e -- --config src/features/statistics/tests/browser/playwright.config.js` | **6/6 đạt**, Chrome; fixture thống kê, cache, empty, 401/403, quyền và responsive 360/768/1280px |
| Probe Node/Playwright dùng `mockReadApi`, mở `#/grades`, nhập `#grades-q` và submit | Tái hiện 1 → 2 form và input trùng ID sau một lần đổi bộ lọc; chưa sửa |
| Probe Chrome + API thật chỉ đọc, ADMIN | Trang đầu quản trị: 12 mã SV và 15 username trên bảng khớp thứ tự/dữ liệu GET API. Chưa đối chiếu mọi cột/mọi trang hoặc mutation thật |
| VS Code Problems | Không báo lỗi frontend; không thay thế kiểm tra runtime duplicate key |
| `git diff --check`; `git diff --exit-code -- fe be database README.md` | Đạt tại thời điểm review; Git có thông báo LF/CRLF. Nguồn ứng dụng cũ/backend/schema/README gốc không đổi |

Diễn biến và giới hạn kiểm tra:

- Lượt E2E chính trong sandbox đã in kết quả từng ca nhưng treo khi kết thúc; dừng lượt đó, chạy lại ngoài sandbox và lấy kết quả hoàn tất 17 đạt/3 lỗi ở trên. Không coi lượt treo là đạt.
- Hai lần probe ban đầu bị timeout do PowerShell truyền tiếng Việt qua stdin thành dấu `?` trong selector; chạy lại bằng selector ASCII và tái hiện được lỗi nhân đôi form. Không coi timeout của probe đó là lỗi ứng dụng.
- Test print media fixture 85 dòng đã đạt trong bộ chính, nhưng chưa kiểm tra trực quan bản in/PDF nhiều trang. Chưa chạy Firefox/WebKit.
- API thật chỉ có login và GET; không tạo/sửa/xóa/khóa/reset dữ liệu có sẵn, không reset hoặc seed DB. Chưa xác định bộ dữ liệu riêng đủ điều kiện thử mutation thật nên phần đó chưa chạy.
- Hạn chế backend B01–B04 trong baseline vẫn là đề xuất riêng; lượt này không sửa API, schema, công thức GPA hoặc quyền. Chưa phát hiện thêm lỗi backend chặn các request đọc đã chạy.

### Cách chạy/xem và chuyển giao

```powershell
npm.cmd --prefix be start
# Terminal khác, nếu dev server chưa chạy:
npm.cmd --prefix fe-react run dev
```

- React: http://127.0.0.1:5173/#/login; frontend cũ: http://localhost:3000. ADMIN xem `#/students`, `#/users`; tái hiện lỗi tại `#/grades` bằng cách đổi bộ lọc rồi bấm Lọc.
- Đã xác nhận nền tảng auth, đọc dữ liệu và giao diện quản trị hoạt động trong các kiểm tra nêu trên; không bổ sung tính năng mới ở lượt này.
- **Chưa đủ điều kiện xác nhận nghiệm thu trọn vẹn giai đoạn 5 để bàn giao sang giai đoạn 6.** Cần sửa lỗi nhân đôi form, sửa và chạy lại parity E2E, đưa 12 ca riêng vào quy trình kiểm tra đầy đủ, cập nhật tài liệu và hoàn tất/ghi rõ bàn giao kiểm thử mutation trên dữ liệu development/test riêng.
- Không commit, push hoặc deploy. Các lỗi được bàn giao để sửa, không đánh dấu đã khắc phục.

## Giai đoạn 4 — Hoàn thiện và nghiệm thu ngày 05/11/2026

### Phạm vi và quyết định

- Người dùng giao thực hiện giai đoạn 4 sau lượt rà soát trên. Tiếp tục từ code trang đọc đã có, không dựng lại hoặc ghi đè phần quản trị giai đoạn 5. Đã đọc lại kế hoạch, nhật ký, git status, code liên quan và tìm hướng dẫn repository trước khi sửa; không tìm thấy AGENTS.md trong repository.
- Giữ nguyên mọi thay đổi có sẵn ngoài phạm vi. Không thêm dependency, không sửa frontend cũ, backend, schema, quyền hay công thức điểm/GPA. Không commit/push/deploy.
- Ba phát hiện code/test trong lượt review trước đã được xử lý: key trùng ở danh sách điểm, selector đối chiếu bảng cũ và discovery E2E bỏ sót test feature. Phần nghiệm thu mutation thật của giai đoạn 5 vẫn thuộc bàn giao riêng, không được coi là hoàn thành bởi lượt này.

### Chức năng đã hoàn thành và đối chiếu

| Yêu cầu | Triển khai và bằng chứng |
|---|---|
| Dashboard/thống kê | Dùng chung service/query hook thống kê và các component thẻ, thanh tỷ lệ, donut CSS, bảng môn. Số liệu do API tính; đối chiếu số liệu/nhãn/bảng/biểu đồ với frontend cũ bằng ADMIN và TEACHER |
| Tra cứu | Service/query riêng; GET sinh viên phân trang phía server, 10 dòng/trang; lọc mã/tên/lớp và chuyển bảng điểm có đường quay lại giữ query/page. Đã so sánh trang 2 và bộ lọc thật |
| Bảng điểm bản thân/chi tiết | Dùng chung TranscriptView; STUDENT dùng `/api/students/me/transcript`, staff dùng `/api/students/:id/transcript`. Summary/GPA thang 10 và từng dòng/cột lấy API; đã đối chiếu tất cả học kỳ và một học kỳ cụ thể với bản cũ |
| Danh sách điểm/lịch sử | Phân trang 15 dòng, lọc mã/tên/học kỳ/môn/kết quả. Modal fetch lịch sử theo grade ID, có loading/empty/error/retry và focus/Escape. Đã đối chiếu trang 2, bộ lọc và **1 dòng lịch sử thật cho mỗi role ADMIN/TEACHER**, bao gồm thời gian, điểm/kết quả cũ-mới, người sửa, lý do |
| URL/cache/draft | Query string nằm trong hash, submit lọc reset page; Back/Forward/reload khôi phục lọc/page. Key gồm phiên, resource, ID/filters/page, truyền AbortSignal. Regression test mới kiểm tra một form duy nhất qua nhiều lần lọc/phân trang/điều hướng, không mất draft khi refetch |
| Trạng thái dữ liệu | QueryState tách tải đầu/refetch; lỗi làm mới giữ cache kèm cảnh báo/retry; mỗi trang có empty state riêng. Test fixture kiểm tra phản hồi cũ, lỗi quyền/phiên, rỗng và số 0/null |
| In bảng điểm | Giữ `window.print()`, A4 ngang; ẩn sidebar/nút/bộ lọc, bỏ overflow/min-width khi in. Test 85 dòng/10 cột đạt; đã xem ảnh print media đầu và cuối bảng, nội dung xuống dòng, đủ cột và dòng cuối, không bị vùng cuộn che |

Các service/hook/page ở [dashboard](../fe-react/src/features/dashboard/), [statistics](../fe-react/src/features/statistics/), [lookup](../fe-react/src/features/lookup/), [transcripts](../fe-react/src/features/transcripts/) và [grades](../fe-react/src/features/grades/) là code có sẵn đã được đọc và xác minh trong lượt này; không nhận các file không sửa là code mới của lượt bàn giao.

### File sửa trong lượt này

| File | Thay đổi |
|---|---|
| [GradeListPage.jsx](../fe-react/src/features/grades/GradeListPage.jsx) | Prefix key riêng cho bộ lọc và kết quả; loại bỏ nhân đôi form/ID khi query string đổi |
| [ReadPages.test.jsx](../fe-react/src/features/lookup/ReadPages.test.jsx) | Regression test lọc, phân trang, Back, refetch giữ draft và duy nhất một bảng/form |
| [read-pages.spec.js](../fe-react/e2e/read-pages.spec.js) | Test trình duyệt đổi lọc nhiều lần/Back/Forward/reload, bắt console error; selector chính xác cho nút trang và tbody dữ liệu cũ; kiểm tra đủ trường lịch sử với API thật |
| [playwright.config.js](../fe-react/playwright.config.js) | Discover cả E2E chính và các test browser theo feature; giữ nguyên code/test quản trị có sẵn |
| [README React](../fe-react/README.md) | Cập nhật phạm vi giai đoạn 4, kiến trúc trang đọc, cách chạy test, phân biệt fixture/live và giới hạn |
| [Nhật ký](./react-migration-progress.md) | Bàn giao kết quả thật; giữ lịch sử lỗi và kết quả review cũ |

### Kiểm tra đã chạy

| Lệnh/kiểm tra | Kết quả cuối |
|---|---|
| `npm.cmd --prefix fe-react run lint` | Đạt, không lỗi/warning ESLint; chạy lại sau chỉnh test cuối |
| `npm.cmd --prefix fe-react test` | **90/90 đạt**, 12 file, gồm regression mới; API fixture/mock |
| Task `React: build` → `npm.cmd --prefix fe-react run build` | Đạt, 149 modules; JS 384.15 kB, gzip 120.55 kB |
| `$env:LIVE_AUTH='1'; npm.cmd --prefix fe-react run test:e2e` | **33/33 đạt**, exit 0; 25 fixture + 8 live, Chrome, 2 workers, không retry test |
| Trong `fe-react`: `$env:LIVE_AUTH='1'; npm.cmd run test:e2e -- e2e/read-pages.spec.js --grep 'live read-only'` | Lượt kiểm tra tập trung giữa quá trình sửa: 3/3 đạt; sau đó bổ sung lịch sử thật và chạy đầy đủ 33/33 như trên |
| `npm.cmd --prefix fe-react run check:proxy` | Đạt: legacy/React 200, auth 401 và API lạ 404 JSON không đổi qua proxy |
| Kiểm tra ảnh print media | Đã xem ảnh đầu/cuối bảng 85 dòng từ Playwright; đủ 10 cột, không sidebar/toolbar, dòng cuối hiện đầy đủ |
| `git diff --check`; `git diff --exit-code -- fe be database README.md` | Đạt; chỉ có thông báo Git LF/CRLF, không thay nguồn ứng dụng cũ |

Diễn biến test: lượt E2E đầu sau sửa key/selector bảng điểm đạt 31/33, phát hiện selector bảng tra cứu/danh sách điểm cũ cũng lấy hàng tiêu đề trong tbody. Đã đọc template để sửa đúng tbody có `data-f="rows"`, không xóa assertion. Lượt tập trung đạt 3/3 nhưng grade chọn ban đầu không có edits; bổ sung tìm bản ghi có lịch sử trong trang hiện tại hoặc tối đa 100 dòng gần nhất, không tải hết điểm/không tạo dữ liệu. Lượt cuối tìm được lịch sử thật và đạt 33/33. Không dùng kết quả trước sửa làm kết quả cuối.

### Hạn chế và bàn giao

- **Đủ điều kiện bàn giao giai đoạn 4 và tiếp tục nghiệm thu giai đoạn 5.** Không có blocker backend cho các luồng đọc đã kiểm tra. Những hạn chế backend ở baseline không thay đổi.
- API thật dùng dữ liệu hiện hữu và các tài khoản demo công bố trong README. Chỉ login và GET; không có mutation DB, reset hoặc seed. Test ghi quản trị/đổi mật khẩu vẫn dùng fixture, không là bằng chứng nghiệm thu giai đoạn 5.
- Chưa kiểm tra Firefox/WebKit, hộp thoại in hệ điều hành hoặc máy in vật lý. Phạm vi đã kiểm tra là Chrome responsive và chế độ CSS print với ảnh trực quan; không tuyên bố đã nghiệm thu mọi máy in hoặc ngắt trang PDF thực tế.
- Đối chiếu dữ liệu thật dùng các trang/bộ lọc và bản ghi nêu trên, không phải vét cạn mọi sinh viên/môn/học kỳ. Trường hợp dữ liệu rỗng/lỗi/race dùng fixture được ghi rõ.
- Không chạy lại npm audit vì không đổi dependency; kết quả audit cũ trong nhật ký là kết quả lịch sử, không phải kết quả mới của lượt này.

### Chạy/xem thử

```powershell
npm.cmd --prefix be start
# Terminal khác; bỏ qua nếu dev server đã chạy:
npm.cmd --prefix fe-react run dev
```

- React: http://127.0.0.1:5173/#/login; frontend cũ: http://localhost:3000.
- ADMIN/TEACHER: dashboard → thống kê → tra cứu → bảng điểm chi tiết; danh sách điểm → lịch sử. STUDENT: bảng điểm của tôi → chọn học kỳ → In bảng điểm.
- Khi chạy test thật, bật `LIVE_AUTH=1` theo README rồi xóa biến sau khi chạy nếu muốn quay lại chế độ fixture mặc định. Express vẫn phục vụ frontend cũ; cấu hình chuyển static React thuộc giai đoạn 8.

## Giai đoạn 5 — Code và kiểm tra ngày 05/11/2026

### Phạm vi, quyết định và trạng thái

- Người dùng giao giai đoạn 5: chỉ quản trị sinh viên/tài khoản theo baseline. Đã đọc nhật ký, baseline phần sinh viên/tài khoản, code React, controller/model/routes, schema liên quan và git status; không tìm thấy AGENTS.md trong repository.
- Phần implementation quản trị và các test fixture đã có sẵn trong working tree (nhiều file untracked). Đã đối chiếu và giữ implementation này; không viết lại hoặc ghi đè các thay đổi giai đoạn 4/người dùng. [routeConfig](../fe-react/src/app/routeConfig.js) đã giới hạn students/users cho ADMIN nên không cần đổi.
- Không sửa frontend cũ, backend, schema, công thức điểm/GPA, quyền hoặc hợp đồng API. Không thêm dependency hay nghiệp vụ. Không triển khai giai đoạn 6–8; không commit/push/deploy.
- **Code quản trị và fixture đạt kiểm tra; chưa nghiệm thu đầy đủ thao tác ghi API thật.** Đã hỏi người dùng xác định backend `http://localhost:3000` là development/test theo quy tắc 7; tại thời điểm ghi mục này chưa nhận câu trả lời. Không tự suy ra localhost đồng nghĩa được phép ghi dữ liệu thử.

### Chức năng hiện có đã xác minh

| Yêu cầu | Code/hành vi |
|---|---|
| Danh sách/thêm/sửa/xóa SV | [StudentsPage](../fe-react/src/features/students/StudentsPage.jsx), [StudentFormDialog](../fe-react/src/features/students/StudentFormDialog.jsx), [studentService](../fe-react/src/features/students/studentService.js). Phân trang server 12; q/class_id/status/page trên URL. POST sinh viên để backend tạo tài khoản cùng transaction; PUT không đổi mã; DELETE chỉ qua endpoint cũ |
| Danh sách/khóa/mở/reset user | [UsersPage](../fe-react/src/features/users/UsersPage.jsx), [userService](../fe-react/src/features/users/userService.js). Phân trang server 15; q/role/page. PATCH gửi boolean thật, reset POST không thêm hợp đồng; tự khóa/mở bị vô hiệu hóa theo user ID |
| Validation/lỗi/draft | React Hook Form, lỗi từng trường, mã/enum/ngày/độ dài; pending khóa input/nút/đóng dialog. 409 mã trùng và 400 lớp không tồn tại gắn lỗi trường. Các lỗi server khác hiển thị trong form/dialog, giữ draft |
| Chống gửi lặp và lỗi mạng | [useAdminMutation](../fe-react/src/features/users/useAdminMutation.js) dùng ref khóa cùng tick, mutation không retry. [adminFeedback](../fe-react/src/features/users/adminFeedback.js) cảnh báo kết quả có thể đã xử lý khi mất mạng; không tự gửi lại |
| Xác nhận | Xóa có mã/tên SV và cảnh báo dữ liệu đăng ký; khóa/mở/reset có username/họ tên, focus Hủy, Escape khi không pending. Pending không đóng hoặc gửi trùng |
| Cache và phân trang | Tạo/sửa/xóa SV invalidate students/users/transcripts/stats/grades/grade-history cùng phiên; thao tác user invalidate users. Xóa dòng cuối hoặc sửa status khiến dòng cuối không còn khớp filter thì về trang hợp lệ, giữ bộ lọc. Refetch không reset bản nháp form |
| Quyền | Guard/menu ADMIN-only; TEACHER/STUDENT không render trang hoặc gửi request quản trị. Fixture kiểm tra backend trả 400/403/404, xóa có đăng ký/điểm trả 409; 401/logout hủy phiên/cache/request cũ |

Giới hạn backend giữ nguyên: email hồ sơ và user không đồng bộ khi sửa (UI có giải thích); khóa/reset mật khẩu không thu hồi tức thì JWT hiện hữu. Không bù bằng quy tắc quyền mới ở client. Chưa phát hiện thêm blocker backend qua các kiểm tra đã chạy.

### File mới/sửa trong lượt giai đoạn 5

- [StudentsPage.test.jsx](../fe-react/src/features/students/StudentsPage.test.jsx): thêm test lỗi mạng giữ form/cảnh báo kết quả chưa chắc chắn/không tự retry, và sửa trạng thái làm rỗng trang cuối của bộ lọc.
- [admin-live.spec.js](../fe-react/src/features/users/tests/browser/admin-live.spec.js): mới, test ghi thật opt-in; chỉ chạy khi cả `LIVE_ADMIN_WRITES=1` và `ADMIN_TEST_ENV=development|test`. Tạo một sinh viên mới có mã riêng, xác minh tài khoản đi kèm, duplicate 409, sửa/đồng bộ tên, khóa/mở/login/reset, 403 thật trên bản ghi riêng, xóa và kiểm tra cache. Cleanup chỉ dựa trên ID từ response 201 và mã chính xác; không xóa dữ liệu có sẵn hoặc theo prefix. **Chưa chạy phần thân test này** vì môi trường chưa xác định; lint và discovery không thay cho chạy tích hợp.
- [README React](../fe-react/README.md): bổ sung phạm vi quản trị, trạng thái kiểm thử, lệnh chạy test ghi riêng và điều kiện môi trường.
- [Nhật ký này](./react-migration-progress.md): lưu kết quả và công việc đang chờ. Các component/service quản trị có sẵn được xác minh, không nhận là file mới của lượt này.

### Kiểm tra đã chạy và kết quả

| Lệnh/kiểm tra | Kết quả |
|---|---|
| `npm.cmd --prefix fe-react run lint` | Đạt, không lỗi/warning ESLint |
| `npm.cmd --prefix fe-react test` | **92/92 đạt**, 12 file; transport fixture/mock |
| Task `React: build` → `npm.cmd --prefix fe-react run build` | Đạt, 149 modules, JS 384.15 kB/gzip 120.55 kB |
| `$env:LIVE_AUTH='1'; npm.cmd --prefix fe-react run test:e2e` | **33 đạt, 1 skip**, exit 0: 25 fixture và 8 auth/đọc thật đạt; ca live ghi quản trị bị skip do chưa bật opt-in |
| 6 ca browser quản trị trong bộ E2E | Đạt: CRUD, lỗi trường/server, named confirmation, focus/Escape/pending, boolean khóa/mở, reset, trang cuối, quyền và viewport 360/1280px; toàn bộ mutation là fixture |
| Ảnh giao diện quản trị | Đã xem form 360/1280 và dialog reset lỗi mobile. Mobile form cuộn trong dialog; không tràn ngang; ảnh chụp khi focus email có phần đầu ngoài vùng cuộn, test vẫn thao tác được các trường/nút |
| `git diff --check`; `git diff --exit-code -- fe be database README.md` | Đạt; chỉ thông báo LF/CRLF. Không thay nguồn ứng dụng cũ/backend/schema |

### Phần chưa chạy và chuyển giao

- Chưa chạy ca `admin-live.spec.js`: chờ người dùng xác định backend đích proxy là development/test. Không tạo/sửa/xóa/khóa/reset dữ liệu thật trong lượt này. API thật đã chạy chỉ login/GET và các kiểm tra đọc/quyền có sẵn.
- Xóa SV có enrollment/điểm chỉ kiểm tra bằng fixture 409. Không tạo enrollment/điểm để thử trong giai đoạn quản trị và không thử DELETE trên SV hiện hữu của người dùng.
- Chưa kiểm tra Firefox/WebKit. Không chạy lại npm audit vì không đổi dependencies. Hạn chế backend B01/B03/B04 vẫn cần đề xuất riêng nếu muốn thay đổi.
- **Chưa chốt nghiệm thu đầy đủ giai đoạn 5 để chuyển sang giai đoạn 6** cho đến khi hoàn tất hoặc được bàn giao rõ kiểm thử ghi API thật. Phần code/frontend đã sẵn sàng cho bước kiểm tra đó.
- Bước tiếp theo: khi môi trường được xác định, chạy test ghi opt-in theo README; kiểm tra cleanup bản ghi riêng, ghi kết quả thực tế tại đây và chỉ sửa lỗi frontend trong phạm vi giai đoạn 5 nếu phát hiện. Không reset/seed để làm test đạt.

### Chạy/xem thử

```powershell
npm.cmd --prefix be start
# Terminal khác, nếu chưa chạy:
npm.cmd --prefix fe-react run dev
```

- Đăng nhập ADMIN tại http://127.0.0.1:5173/#/login rồi mở `#/students` hoặc `#/users`. Không thử ghi vào bản ghi đang sử dụng nếu chưa xác định môi trường development/test.
- Frontend cũ tiếp tục tại http://localhost:3000. Cách bật test ghi riêng và hai biến môi trường được ghi ở README; mặc định test đó không chạy.

## Giai đoạn 6 — triển khai và bàn giao ngày 06/11/2026

### Phạm vi và quyết định

- Thực hiện theo yêu cầu giai đoạn 6 mới nhất; việc nghiệm thu ghi thật của giai đoạn 5 vẫn để mở. Đã đọc kế hoạch, baseline phần HP01–03/DIEM01–02, progress, git status, frontend cũ, gradeService, gradesController, gradeModel, utils/grade và kiến trúc React trước khi sửa. Không tìm thấy AGENTS.md. Giữ nguyên các thay đổi có sẵn của giai đoạn 4–5.
- Không sửa [frontend cũ](../fe/), [backend](../be/), schema, công thức điểm/GPA, quyền, API hay dependency. Không triển khai import/giai đoạn 7–8; không commit/push/deploy.
- Giữ route hash `#/entry`. Chuyển root từ declarative HashRouter sang createHashRouter/RouterProvider để dùng cơ chế [useBlocker](https://reactrouter.com/7.18.5/api/hooks/useBlocker) được hỗ trợ, kết hợp beforeunload cho refresh/đóng trang. Không tự monkey-patch history hoặc dựng lại router.
- Giữ chọn học kỳ/lớp trong state trang như baseline. Học kỳ ACTIVE đầu tiên, nếu không có thì học kỳ cuối; chọn lớp đầu. Mỗi lớp có editor riêng, đổi lớp/học kỳ phải xác nhận bỏ draft. Metadata refetch thiếu lựa chọn cũ vẫn giữ context đang sửa để không unmount draft.
- Mutation không tự retry; một thao tác ghi tại một thời điểm. Lưu tất cả tuần tự, chỉ dòng dirty; khóa bảng trong batch, khóa dòng đang lưu. Các dòng khác được sửa trong lúc lưu một dòng. Phản hồi cũ không xóa chỉnh sửa mới; request GET trước mutation bị cancel trước khi patch cache.

### Chức năng và file chính

| File | Hoàn thành |
|---|---|
| [GradeEntryPage](../fe-react/src/features/grade-entry/GradeEntryPage.jsx), [useOfferings](../fe-react/src/features/grade-entry/useOfferings.js), [entryService](../fe-react/src/features/grade-entry/entryService.js) | Học kỳ → lớp → SV; query key chứa semester/offering ID, AbortSignal, endpoint/response thật; trạng thái không có học kỳ/lớp/SV, loading/refetch/error/retry |
| [OfferingEditor](../fe-react/src/features/grade-entry/OfferingEditor.jsx), [GradeEntryRow](../fe-react/src/features/grade-entry/GradeEntryRow.jsx), [CSS](../fe-react/src/features/grade-entry/grade-entry.css) | Component bảng/input/event handler, trạng thái mỗi dòng, tổng kết chính thức, thêm SV, xác nhận xóa có mã/tên/lớp; tái dùng GradeHistoryModal và DataTable; bảng cuộn ngang trên màn hình hẹp |
| [useGradeDrafts](../fe-react/src/features/grade-entry/useGradeDrafts.js) | Draft theo enrollment_id, base/values/dirty/saving/error/saved; giữ draft lỗi/refetch; tổng số lưu thành công/thất bại; khóa gửi trùng; lấy grade ID mới từ response cho xóa/lịch sử |
| [gradeDraft](../fe-react/src/features/grade-entry/gradeDraft.js) | Khớp parseScore: 0 khác blank; CC/GK optional, CK required; 0–10 kiểm tra trước làm tròn, chấp nhận dấu phẩy; không tính tổng/letter/result/GPA tại client |
| [EntryLeaveGuard](../fe-react/src/features/grade-entry/EntryLeaveGuard.jsx), [LeaveGuardProvider](../fe-react/src/app/LeaveGuardProvider.jsx), [context](../fe-react/src/app/LeaveGuardContext.js) | Xác nhận menu/Back/Forward/đổi học kỳ/lớp/đăng xuất; pending yêu cầu chờ; native beforeunload. Mã SV đang nhập ở form enroll cũng được bảo vệ |
| [App](../fe-react/src/app/App.jsx), [AppProviders](../fe-react/src/app/AppProviders.jsx), [Sidebar](../fe-react/src/components/layout/Sidebar.jsx), [AppLayout](../fe-react/src/components/layout/AppLayout.jsx) | Tích hợp data hash router và guard đăng xuất; cập nhật thông báo phạm vi đã chuyển |
| [studentService](../fe-react/src/features/students/studentService.js) | Bổ sung invalidate offering-students khi quản trị sửa hồ sơ, để tên SV trong nhập điểm không bị cache cũ |
| [GradeEntryPage.test](../fe-react/src/features/grade-entry/GradeEntryPage.test.jsx), [fixture](../fe-react/src/features/grade-entry/tests/entryFixtures.js), [browser fixture](../fe-react/src/features/grade-entry/tests/browser/entry.spec.js), [browser live](../fe-react/src/features/grade-entry/tests/browser/entry-live.spec.js) | 26 unit/component cases, 6 Chrome fixture cases, 2 Chrome read-only live cases mới |
| [AppRoutes.test](../fe-react/src/app/AppRoutes.test.jsx), [readFixtures](../fe-react/src/test/readFixtures.js), [foundation.spec](../fe-react/e2e/foundation.spec.js) | Bỏ kỳ vọng nhập điểm là placeholder, thêm offerings fixture rỗng; giữ kiểm tra hash deep-link/Back |
| [README React](../fe-react/README.md), [nhật ký](./react-migration-progress.md) | Cách chạy, kiến trúc, kết quả và checklist tích hợp còn chờ |

Sau lưu/xóa, invalidate offering-students, grades, transcripts, grade-history, stats theo session. Enroll thêm invalidate offerings để cập nhật số đăng ký. Cache patch chỉ thay dòng tác động, giữ draft các dòng khác; refetch làm mất enrollment khỏi response cũng vẫn giữ dòng dirty để người dùng xử lý lỗi. Trường hợp refetch sau lưu lỗi, vẫn hiển thị grade ID/kết quả từ response lưu cùng cảnh báo dữ liệu chưa làm mới.

### Kiểm tra thực tế

| Lệnh/kiểm tra | Kết quả cuối đã thu được |
|---|---|
| `npm.cmd --prefix fe-react run lint` | Đạt, exit 0, không warning/error |
| `npm.cmd --prefix fe-react test` | **117/117 đạt, 13 file**, exit 0; gồm 26 ca nhập điểm, transport fixture |
| `npm.cmd --prefix fe-react test -- src/features/grade-entry/GradeEntryPage.test.jsx` | 26/26 đạt trong lượt tập trung trước lượt đầy đủ |
| Task `React: build` → `npm.cmd --prefix fe-react run build` | Đạt; 159 modules, JS 451.32 kB, gzip 140.87 kB; không thêm dependency |
| Trong fe-react: `$env:LIVE_AUTH='1'; npm.cmd run test:e2e` | Lượt cuối đầy đủ: **31 fixture đạt, 10 live lỗi kết nối, 1 skip** vì backend đã dừng sau gián đoạn phiên; không coi lượt này là toàn bộ đạt |
| Sau khởi động lại backend/proxy: `$env:LIVE_AUTH='1'; npm.cmd run test:e2e -- --last-failed` | **10/10 live đạt**, exit 0, 17.8s. Tổng phạm vi đã xác minh qua hai lượt: 31 fixture + 10 live; không tuyên bố 41 ca cùng đạt trong một lượt |
| `npm.cmd --prefix fe-react run check:proxy` | Đạt sau khởi động server: legacy/React 200, API 401/404 JSON không đổi |
| Problems trong app/layout/grade-entry | Không có lỗi |
| `git diff --check`; `git diff --exit-code -- fe be database README.md` | Đạt trước cập nhật tài liệu cuối; chỉ cảnh báo LF/CRLF, không thay nguồn cũ/backend/schema |
| Ảnh browser 360/1280px | Đã xem ảnh: bảng cuộn ngang trong khung, input/lỗi tại trường và form enroll hiển thị; không tràn toàn trang. Chưa kiểm tra Firefox/WebKit |

Coverage mới: điểm 0/10/dấu phẩy/biên trước làm tròn, optional CC/GK/thiếu CK, lỗi trường không gửi API; lưu chỉ dirty, partial 403, lỗi mạng không retry/giữ draft; double-click/pending/khóa input; delete thành công/lỗi 403 giữ draft; enroll 409 giữ code/thành công giữ dòng khác; invalidation; GET chậm lớp cũ; metadata/refetch không xóa draft; response lưu vẫn có grade ID/kết quả khi GET sau đó lỗi; STUDENT bị guard; TEACHER 403 giữ phiên. Chrome xác minh dialog focus/Escape, hủy menu/Back/Forward/đổi lớp/học kỳ/logout, xác nhận bỏ draft, reload native thật và lưu pending khi điều hướng.

Đối chiếu chỉ đọc API thật cùng tài khoản/bộ lọc:

- ADMIN: học kỳ mặc định và toàn bộ option lớp khớp legacy; lớp ID 85 có 102 SV, lớp ID 87 có 104 SV. So sánh tất cả enrollment ID/mã/tên/CC/GK/CK/tổng kết/chữ/kết quả ở hai lớp với API và UI cũ.
- TEACHER teacher01: tương tự lớp ID 12 có 112 SV và ID 19 có 109 SV. GET sinh viên của lớp có trong danh sách ADMIN nhưng không thuộc teacher trả đúng 403 và thông báo backend. Không gọi PUT/DELETE/enroll thật để kiểm tra quyền ghi.
- Hồi quy 8 ca live auth/trang đọc giai đoạn trước cũng đạt trong lượt chạy lại. Test ghi quản trị thật vẫn skip vì không bật opt-in; không ghi business data thật trong giai đoạn này.

Diễn biến lỗi kiểm thử, không che bằng retry: ca hủy refresh đầu tiên timeout do test chờ navigation đã bị hủy; sửa trigger reload không đợi navigation, chạy lại đạt. Lượt live ban đầu dùng hàng nghìn call đọc từng ô trên lớp >100 SV nên timeout; đổi sang đọc snapshot toàn bảng trong một call, vẫn kiểm tra mọi dòng/cột, hai ca cuối hoàn tất 2.5s/2.1s. Một lượt đang chạy bị gián đoạn khi người dùng tiếp tục, không dùng kết quả thiếu completion. Lượt tiếp theo backend dừng gây ECONNREFUSED; khởi động task có sẵn, check proxy, chạy lại đúng 10 ca lỗi và đạt. Không giảm assertion, không tăng timeout để giấu lỗi, không sửa dữ liệu thật.

### Hạn chế, nghiệm thu và chuyển giao

- **Code giai đoạn 6 hoàn thành; chưa nghiệm thu đầy đủ thao tác ghi API thật.** Câu hỏi xác định localhost:3000 là development/test từ giai đoạn 5 chưa có câu trả lời. Chỉ login/GET thật; lưu/xóa/enroll và từ chối quyền ghi kiểm thử bằng fixture. Không dùng kết quả fixture để tuyên bố transaction/lịch sử/DB thật đã đạt.
- Cần môi trường development/test cùng lớp và SV thử riêng để chạy PUT tạo/sửa điểm (0, 10, một thành phần trống, tất cả thành phần), đối chiếu tổng/chữ, lịch sử khi đổi tổng, DELETE và enroll, kiểm tra TEACHER bị từ chối thao tác ghi ngoài lớp. API không có xóa enrollment nên không tạo dữ liệu tạm rồi cố cleanup bằng SQL/xóa dữ liệu cũ; thống nhất giữ dữ liệu thử trước khi chạy.
- Draft chỉ ở bộ nhớ phiên/trang. Bỏ thay đổi có xác nhận, chấp nhận reload hoặc phiên bị thu hồi sẽ xóa draft; không persist điểm vào localStorage. Native beforeunload phụ thuộc chính sách/đóng cưỡng bức của browser; không phải tự lưu. Đã kiểm tra điều hướng qua router/menu/Back/Forward; chưa kiểm tra sửa hash thủ công trên thanh địa chỉ hoặc trình duyệt khác.
- Không phát hiện blocker backend mới; giữ hành vi hiện có: history chỉ ghi khi total đổi, tạo grade không tạo history, xóa grade giữ enrollment/status. Các đề xuất backend trong baseline vẫn tách riêng.
- Có thể dùng code này làm nền cho giai đoạn 7 nếu bàn giao rõ checklist ghi thật còn mở; **chưa đủ căn cứ chốt nghiệm thu toàn bộ giai đoạn 6** trước khi hoàn tất kiểm thử ghi thật. Chưa triển khai giai đoạn 7.

Chạy/xem: `npm.cmd --prefix be start` và `npm.cmd --prefix fe-react run dev` (bỏ qua nếu task đã chạy); đăng nhập ADMIN/TEACHER tại http://127.0.0.1:5173/#/entry. Frontend cũ http://localhost:3000 còn hoạt động. Dùng task VS Code tương ứng để dừng server sau khi xem. Lệnh LIVE_AUTH chỉ bật auth/đọc; không bật test ghi hay thay đổi dữ liệu.

## Giai đoạn 7 — Import Excel, 06/11/2026

### Phạm vi và hợp đồng đã xác minh

- Đọc kế hoạch giai đoạn 7, baseline, nhật ký, git status, template/vImport cũ, routes/grades, importTemplate/importGrades trong gradesController, gradeService/model và API client trước khi sửa. Không có AGENTS.md. Giữ nguyên thay đổi có sẵn giai đoạn 4–6.
- GET `/api/import/template` xác thực staff trả XLSX blob; POST `/api/import/grades` xác thực staff và `upload.single('file')`, multipart, memory storage. Server đọc sheet đầu, kiểm tra 4 cột và tối đa 5.000 dòng. Không có filter MIME/extension; UI cũ accept xlsx/xls. React không parse workbook hoặc tái triển khai nghiệp vụ chọn offering/quyền/điểm.
- Điểm trong file ghi vào CK/tổng kết, CC/GK cũ thành null; từng dòng transaction riêng. `failed` là tổng lỗi, `errors` chỉ 100 dòng đầu. UI giải thích cả hai hành vi và phân biệt request lỗi với response 200 có lỗi từng dòng.
- Giới hạn dung lượng thực tế: source Busboy phát sự kiện limit khi fileSize bằng fileSizeLimit. Đã chạy Node/http server local tạm dùng chính multer cài trong backend, cùng memoryStorage/limit/single('file'), không nạp controller hoặc DB: 5.242.879 byte nhận, 5.242.880 và 5.242.881 byte đều LIMIT_FILE_SIZE. UI chặn `size >= 5*1024*1024`, ghi “nhỏ hơn 5 MiB”. Đây là bám hành vi đang chạy, không đổi hợp đồng backend.
- Không thay frontend cũ/backend/schema/công thức/quyền/dependencies. Không làm giai đoạn 8; không commit/push/deploy. Node XLSX ở browser tests dùng dependency backend sẵn có để tạo/đọc workbook test; không được import vào mã ứng dụng.

### File và chức năng đã hoàn thành

| File | Thay đổi |
|---|---|
| [ImportPage](../fe-react/src/features/import/ImportPage.jsx) | Thay placeholder bằng hướng dẫn hợp đồng, tải mẫu, file picker/validation, tên/kích thước file, pending, lỗi request/unknown outcome; input/nút khóa khi import |
| [ImportResult](../fe-react/src/features/import/ImportResult.jsx), [import.css](../fe-react/src/features/import/import.css) | Total/created/updated/failed chính thức, tên file đã gửi, trạng thái toàn bộ/một phần/toàn bộ dòng lỗi, row/message dạng text an toàn, thông báo cắt ở 100 lỗi; bảng đọc được ở 360px và cuộn đến dòng lỗi cuối |
| [importService](../fe-react/src/features/import/importService.js) | GET blob có signal, FormData field file không tự Content-Type, validation extension/0 byte/size; kiểm tra cấu trúc response để không báo thành công giả; object URL revoke sau khi bắt đầu download |
| [useGradeImport](../fe-react/src/features/import/useGradeImport.js) | TanStack mutation retry=false, khóa ref chống cùng-tick double submit; invalidate theo session khi có changed rows, hoặc khi kết quả không xác định; hủy download khi unmount; beforeunload khi upload pending |
| [ImportPage.test](../fe-react/src/features/import/ImportPage.test.jsx) | 26 ca unit/component fixture mới |
| [import.spec](../fe-react/src/features/import/tests/browser/import.spec.js) | 5 ca Chrome fixture và 3 ca live tải mẫu/quyền GET; dữ liệu workbook chỉ ở test |
| [AppRoutes.test](../fe-react/src/app/AppRoutes.test.jsx), [AppLayout](../fe-react/src/components/layout/AppLayout.jsx) | Kiểm tra import không gọi API trước thao tác người dùng; cập nhật thông báo giai đoạn chuyển đổi |
| [README](../fe-react/README.md), [nhật ký](./react-migration-progress.md) | Cách chạy/kiểm tra, giới hạn, kết quả và phần chờ nghiệm thu |

Cache: khi created+updated>0, invalidate offering-students, grades, transcripts, grade-history, stats và offerings (có thể tạo enrollment), không tự tạo/cập nhật cache hồ sơ/danh mục. Nếu tất cả dòng lỗi thì không invalidation theo thành công. Với lỗi mạng, HTTP 5xx/408 hoặc response 2xx malformed, kết quả không xác định: có thể đã commit, nên invalidate nhóm trên để đọc lại nhưng không giả số liệu, không tự gửi lại. Giữ file/lỗi để người dùng kiểm tra rồi quyết định. Đổi lựa chọn file không tự xóa cảnh báo chưa xác định.

### Kiểm tra và kết quả

| Lệnh/kiểm tra | Kết quả |
|---|---|
| Node script qua stdin: local http + multer + FormData với ba kích thước quanh 5 MiB | Đạt 3/3 biên nêu trên; exit 0; không chạy API nghiệp vụ hoặc DB |
| `npm.cmd --prefix fe-react test -- src/features/import/ImportPage.test.jsx` | 26/26 đạt, fixture |
| `npm.cmd --prefix fe-react test` | **143/143 đạt**, 14 file, exit 0 |
| `npm.cmd --prefix fe-react run lint` | Đạt sau lần sửa selector; không lỗi/warning |
| Task `React: build` → `npm.cmd --prefix fe-react run build` | Đạt sau chỉnh CSS; 162 modules; JS 457.90 kB, gzip 142.93 kB; CSS 24.08 kB |
| Trong fe-react: `$env:LIVE_AUTH='1'; npm.cmd run test:e2e` | 46 đạt, 3 lỗi selector fixture, 1 skip; 13 ca live đọc/auth/tải mẫu đều đạt |
| `$env:LIVE_AUTH='1'; npm.cmd run test:e2e -- --last-failed` | Sau sửa selector: **3/3 đạt**, exit 0. Tổng ca đã đạt qua hai lượt: **49 = 36 fixture + 13 live**; không tuyên bố tất cả cùng đạt một lượt |
| `npm.cmd run test:e2e -- src/features/import/tests/browser/import.spec.js --grep multipart` | Sau chỉnh bảng lỗi mobile: **2/2 đạt** ở 360/1280px, không cuộn ngang, đọc/cuộn được dòng cuối số 101 |
| `npm.cmd --prefix fe-react run check:proxy` | Đạt legacy/React 200, API 401/404 JSON không đổi |
| Problems feature import; `git diff --check`; `git diff --exit-code -- fe be database README.md` | Không lỗi; nguồn cũ/backend/database không bị sửa. Git có cảnh báo LF/CRLF |
| Ảnh browser | Đã xem 360/1280px; ban đầu bảng dùng min-width chung gây cuộn ngang mobile, đã sửa CSS riêng import và xem lại ảnh 360px: nội dung lỗi xuống dòng, không che cột |

Coverage fixture: thiếu file/0 byte/đuôi sai/đuôi hoa/xls/MIME rỗng, biên size; GET mẫu Bearer/blob/URL cleanup, download lỗi và response đến sau unmount; FormData đúng field và multipart boundary thật Chrome, workbook bytes nguyên vẹn, không Content-Type thủ công; pending/double-click/no fake progress; full success/partial/all rows failed; 100/125 hoặc 100/121 lỗi giữ đúng failed và số dòng; mã SV/môn/học kỳ sai, teacher sai lớp; 400 workbook sai/rỗng/thiếu cột/>5.000 dòng/quá size; 403 không logout, logout thu hồi request import cũ; network/500/malformed response giữ file/không retry/cảnh báo chưa xác định; cache ảnh hưởng và cache users/students/meta không bị invalidate; STUDENT guard; XSS payload được render text.

API thật: ADMIN và TEACHER tải thành công `excel_template.xlsx` từ UI có token; test đọc file tải về bằng XLSX ở Node, xác nhận 8 cột đúng thứ tự, một dòng mẫu SV0001, filename và object URL được revoke. STUDENT GET template trả 403. Không upload file hay ghi business data vào DB thật; 10 ca live các giai đoạn trước cũng đạt.

Lỗi test đã xử lý: Playwright getByLabel('File Excel') khớp cả section “Nhập điểm từ file Excel” và input nên 3 ca thất bại trước upload. Dùng exact:true cho input, giữ nguyên assertion nghiệp vụ; 3 ca chạy lại đạt. Sau ảnh mobile, chỉnh riêng min-width/table-layout bảng lỗi và bổ sung kiểm tra không cuộn ngang/dòng cuối; 2 ca responsive chạy lại đạt. Không dùng mock để thay cho kết quả upload thật.

### Hạn chế, đề xuất backend riêng và bàn giao

- **Code giai đoạn 7 đã hoàn thành; chưa nghiệm thu đầy đủ import ghi DB thật.** Môi trường localhost chưa được người dùng xác định development/test theo quy tắc 7, nên chỉ login/GET thật. Các ca POST thành công/một phần/400/403 trong kiểm thử là fixture/intercept.
- Cần môi trường development/test và dữ liệu thử riêng để kiểm tra upload thật: tạo/cập nhật điểm, dòng trùng, điểm 0, CC/GK về null, lịch sử/tổng kết/cache, enrollment mới; dòng sai SV/môn/học kỳ/quyền và lỗi toàn file. Không reset/seed hoặc xóa dữ liệu đang dùng; API không có cleanup enrollment nên thống nhất dữ liệu thử trước khi chạy.
- **Đề xuất backend B02 vẫn tách riêng, không sửa:** [importGrades](../be/controllers/gradesController.js) nhận teacherId có thể undefined; [findImportOffering](../be/models/gradeModel.js) chỉ thêm điều kiện teacher khi giá trị truthy. Tài khoản TEACHER thiếu hồ sơ teachers có thể import ngoài quyền. Đề xuất kiểm tra teacherId tồn tại và trả 403 trước xử lý workbook; cần kiểm thử backend riêng, không bù bằng client filter. Không tạo/xóa hồ sơ teacher thật để tái hiện.
- Không có endpoint theo dõi/hủy transaction import. Điều hướng khỏi SPA có thể làm mất phần trình bày kết quả đang xem; request đã gửi vẫn có thể commit. Cache được invalidation khi nhận kết quả trong session ban đầu; logout thu hồi session/request phía client không chứng minh server rollback. UI hướng dẫn chờ kết quả và native beforeunload cảnh báo refresh khi pending. Không lưu file/kết quả vào localStorage hoặc tự gửi lại.
- Chưa kiểm tra Firefox/WebKit. Không chạy lại audit do không thay dependencies. Chưa triển khai phục vụ bản build qua Express (giai đoạn 8).
- Có thể bàn giao code để chuẩn bị giai đoạn 8, nhưng **chưa đủ căn cứ nghiệm thu toàn bộ migration/deploy** trước khi hoàn tất checklist ghi thật của giai đoạn 5–7 và xem xét B02. Không tự bắt đầu giai đoạn 8.

Chạy/xem: `npm.cmd --prefix be start`, `npm.cmd --prefix fe-react run dev` nếu server chưa chạy; đăng nhập ADMIN/TEACHER tại http://127.0.0.1:5173/#/import. Frontend cũ vẫn ở http://localhost:3000. Chỉ tải mẫu/xem khi môi trường ghi chưa được xác định; LIVE_AUTH=1 không bật upload thật.

## Giai đoạn 8 — Hoàn thiện và chạy production, 06/11/2026

### Phạm vi, đối chiếu trước khi sửa

- Đọc kế hoạch, baseline (12 route, 27 endpoint, C01–C21, F01–F08 và B01–B04), nhật ký các giai đoạn trước, code liên quan và git status. Không tìm thấy AGENTS.md. Giữ toàn bộ thay đổi có sẵn giai đoạn 4–7; không commit/push/deploy.
- Checklist trước đủ nền tảng triển khai cấu hình và kiểm tra giai đoạn 8, nhưng chưa đủ nghiệm thu ghi dữ liệu thật. Đã hỏi xác định môi trường localhost development/test; chưa nhận xác nhận nên chỉ login/GET thật, mọi thao tác ghi trong test frontend vẫn là fixture.
- Backend/MySQL ban đầu chưa listen; đã khởi động task backend legacy ở 3000 và xác nhận kết nối. Chrome đã có. Không thiếu các môi trường này; phần ghi bị chặn bởi chưa xác định môi trường dữ liệu thử, không phải thiếu backend/MySQL/browser.
- Backend chỉ đổi phần mount static trong [server.js](../be/server.js), thêm cấu hình static, launcher, script/test liên quan. API routes, JSON 404, error handler, controller/model/service, schema, công thức GPA/điểm và quyền không đổi. Không chỉnh [frontend cũ](../fe/) hoặc [database](../database/).

### Sửa lỗi và hoàn thành

| File chính | Kết quả |
|---|---|
| [ImportLeaveGuard](../fe-react/src/features/import/ImportLeaveGuard.jsx), [ImportPage](../fe-react/src/features/import/ImportPage.jsx) | Chặn menu/Back và đăng xuất chủ động khi upload pending; dialog giải thích rời trang không hủy commit. Ở lại được bằng nút/Escape, không tự chuyển trang khi request kết thúc để người dùng đọc kết quả. Hết hạn phiên/đăng xuất từ tab khác vẫn thu hồi session theo auth |
| [ImportPage.test](../fe-react/src/features/import/ImportPage.test.jsx), [AppRoutes.test](../fe-react/src/app/AppRoutes.test.jsx) | Dùng data router trong test giống ứng dụng để kiểm tra blocker; giữ kiểm tra session bị thu hồi khi import còn pending |
| [styles](../fe-react/src/styles/index.css), [AppLayout](../fe-react/src/components/layout/AppLayout.jsx) | Clip skip-link khi chưa focus để tránh vệt trong ảnh toàn trang sau cuộn, vẫn hiện khi Tab/focus và focus main không đổi hash. Bỏ banner tiến độ migration khỏi UI người dùng |
| [frontend config](../be/config/frontend.js), [server](../be/server.js), [.env.example](../be/.env.example) | `FRONTEND=legacy|react`, default legacy; chọn thư mục cố định fe hoặc fe-react/dist. Mount sau API/JSON 404. Mode sai báo lỗi startup, thiếu index trả 503 no-store kèm hướng dẫn, không fallback lặng lẽ. Index no-cache, asset React có hash immutable, tài nguyên/URL lạ 404 text |
| [launcher](../be/scripts/start-frontend.js), [backend scripts](../be/package.json) | `start:react`, `start:legacy` chạy cross-platform, tùy chọn port. Resolve cwd backend để đọc cấu hình đúng, không sửa .env hoặc database. Thêm `test:frontend`, `test:frontend:live` |
| [production config](../fe-react/playwright.production.config.js), [frontend scripts](../fe-react/package.json) | `test:e2e:production` tự chạy chính Express/MySQL ở 5181 trên build có sẵn, không dùng Vite/preview; không reuse server không biết nguồn gốc. Loại riêng 6 test preview component dev |
| [production smoke](../fe-react/e2e/production.spec.js), [auth E2E](../fe-react/e2e/auth.spec.js), [read E2E](../fe-react/e2e/read-pages.spec.js), [import E2E](../fe-react/src/features/import/tests/browser/import.spec.js) | Asset/API status, hash trực tiếp/refresh/URL sai, keyboard skip-link, đổi người dùng, import pending, PDF nhiều trang; chạy lại các test nhập điểm/lưu một phần/modal/responsive hiện có trên production |
| [static tests](../be/tests/frontend.test.js), [rollback live test](../be/tests/frontend-live.test.js) | 3 test cấu hình/static với thư mục fixture riêng; 1 test khởi động React thật → dừng → legacy cùng cổng 5192. Không di chuyển/xóa build thực hoặc ghi DB |
| [README root](../README.md), [README React](../fe-react/README.md), nhật ký này | Kiến trúc, cấu hình/ưu tiên biến môi trường, build/run/test, rollback, ma trận và điều kiện nghiệm thu |

Quyết định: giữ hash router (createHashRouter/RouterProvider); không cần catch-all HTML cho đường dẫn server. Production chỉ cần build, Express và MySQL; `/api` cùng origin. `FRONTEND` của shell ưu tiên `.env`, launcher chọn mode rõ ưu tiên cả hai. Không thay mặc định sang React trước khi nghiệm thu ghi thật. Build thiếu không làm API thành HTML hay tự chuyển về legacy. Rollback chỉ chọn legacy rồi restart/reload, không reset dữ liệu.

### Kiểm tra đã chạy

| Lệnh/kiểm tra | Kết quả thực tế |
|---|---|
| `npm.cmd --prefix fe-react test` | **143/143 đạt**, 14 file, exit 0; fixture/component/API client/session integration |
| `npm.cmd --prefix fe-react run lint` | **Đạt**, exit 0. Lượt đầu phát hiện regex test escape thừa; đã sửa và chạy lại sạch |
| Task `React: build` → `npm.cmd --prefix fe-react run build` | **Đạt** sau sửa CSS cuối; 163 modules; JS 458.35 kB, gzip 143.05 kB; CSS 24.11 kB |
| `npm.cmd --prefix be run test:frontend` | **3/3 đạt**: mode sai, legacy/react index+asset+hash, tài nguyên sai, build thiếu 503, GET/POST API vẫn JSON 404; không DB |
| `npm.cmd --prefix be run test:frontend:live` | **1/1 đạt**: chính server kết nối MySQL, React asset thật, dừng rồi legacy cùng cổng 5192, asset cũ và API 401/404 JSON; không ghi business data |
| Trong fe-react: `$env:LIVE_AUTH='1'; npm.cmd run test:e2e:production` | Lượt cuối **47 đạt, 1 skip, 0 lỗi**, 48.0 giây, exit 0. 33 fixture + 13 live auth/đọc/tải mẫu + 1 HTTP production thật. Skip chỉ test ghi quản trị opt-in |
| `npm.cmd --prefix fe-react run test:e2e -- e2e/foundation.spec.js` | **6/6 đạt**, exit 0: trang component dev, focus trap/Escape/restore, toast, layout 360/768/1280px |
| Problems trên server/static/import guard/CSS | Không lỗi |
| `git diff --check`; `git diff --exit-code -- fe database be/controllers be/models be/services be/routes be/middleware be/utils be/config/db.js` | Exit 0; không đổi nguồn cũ/schema/API/nghiệp vụ. Git có cảnh báo chuẩn hóa LF/CRLF, không lỗi whitespace |
| Print | Chrome print-media fixture **85 dòng/10 cột**, kiểm tra không vùng cuộn cắt, ẩn sidebar/nút/lọc; đã xem ảnh đầu/cuối. Chrome PDF engine xuất **7 trang**. Chưa kiểm tra trực quan từng trang PDF hoặc hộp thoại/máy in hệ điều hành |
| Ảnh UI | Đã xem ảnh import mobile, form SV mobile và bảng in; các E2E xác minh cuộn ngang trong bảng, cuộn tới lỗi import cuối, không tràn viewport, dialog/keyboard và loading/error |

Lượt production đầu đạt 46/46 thực chạy (1 skip), sau đó thêm test đổi người dùng/PDF và chỉnh clip skip-link nên chạy lại toàn suite được 47 đạt như trên. Không cộng hai lượt thành số test riêng. Tổng E2E duy nhất đã đạt ở giai đoạn này: **53** (47 production + 6 foundation dev); toàn bộ 54 ca gồm thêm 1 ca ghi quản trị chưa chạy. Mỗi ca ghi API trong fixture được intercept, không được gọi là tích hợp ghi backend.

API thật đối chiếu lại cùng tài khoản/bộ lọc với legacy: ADMIN/TEACHER dashboard, stats, lookup trang 2, transcript theo học kỳ, grade list/history (có 1 dòng lịch sử trong dữ liệu hiện tại); STUDENT bảng điểm bản thân/quyền. Nhập điểm chỉ đọc: ADMIN lớp 85/87 có 102/104 dòng, TEACHER lớp 12/19 có 112/109 dòng; API/cells khớp legacy, lớp ngoài quyền bị từ chối. ADMIN/TEACHER tải XLSX thật, xác minh 8 cột/mẫu/URL cleanup; STUDENT template GET 403.

### Ma trận C01–C21 cuối đợt

| ID | Đối chiếu/kết quả | Phần chưa nghiệm thu thật |
|---|---|---|
| C01 | Login A/T/S, sai mật khẩu thật đạt; tài khoản khóa/mạng fixture đạt | Login sau khóa tài khoản thử |
| C02 | Refresh/token sai thật; storage hỏng, session race, logout đa tab/đổi người dùng fixture đạt | Không tuyên bố backend thu hồi JWT khi khóa/reset (B01) |
| C03 | Menu/route guard 3 role fixture; API GET ngoài quyền thật 403 | API ghi ngoài quyền thật, đặc biệt import B02 |
| C04 | Tra cứu/filter/pagination khớp legacy/API thật; rỗng/page ngoài phạm vi fixture | Không còn blocker frontend xác định |
| C05 | Bảng điểm bản thân/staff/filter/summary đúng API thật; null/0/404 fixture | Không tính GPA ở client |
| C06 | 85 dòng/10 cột print media, ảnh đầu/cuối; PDF Chrome 7 trang | Chưa xem từng trang PDF, hộp thoại in OS/máy in |
| C07 | Dashboard/stats A/T khớp legacy/API; chart rỗng/0 fixture | Không còn blocker frontend xác định |
| C08 | Grades/filter/page/history khớp legacy/API; history rỗng/focus fixture | Lịch sử phát sinh sau sửa thật |
| C09 | CRUD/validation/409/403/giữ form fixture đạt | Tạo/sửa/xóa SV thật, lỗi đã có đăng ký |
| C10 | Filters/page12/xóa dòng cuối chuyển trang fixture đạt | Invalidation sau CRUD thật |
| C11 | Boolean lock/unlock, xác nhận/reset/self-lock/role fixture đạt | Lock/reset/login bằng tài khoản thử thật |
| C12 | Metadata/lớp/danh sách SV thật khớp; teacher GET ngoài lớp 403; các empty fixture | Enroll thật vào lớp thử |
| C13 | 0/10/ngoài khoảng/blank/thiếu CK/CC/GK optional/comma fixture đối chiếu contract | Lưu biên vào DB và so kết quả thật |
| C14 | API response ID dùng ngay cho history/delete fixture đạt | Tạo/xóa grade và lịch sử thật |
| C15 | Dirty-only, lưu một phần, giữ draft lỗi/refetch, khóa pending, chống lặp, menu/Back/Forward/chọn lớp/học kỳ/logout/beforeunload Chrome fixture đạt | Các write thật; đổi hash thủ công ngoài router chưa kiểm tra |
| C16 | Tải mẫu thật/quyền GET đạt; FormData/type/size/400 fixture, biên Multer đã xác minh ở GĐ7 | Upload file vào API/DB thật |
| C17 | Total/failed/max100/số dòng/mã sai/quyền fixture đạt | Import partial/quyền thật; B02 vẫn mở |
| C18 | Unknown outcome không retry, cảnh báo/cập nhật cache, import pending guard fixture đạt | CC/GK về null/dòng trùng/transaction thật |
| C19 | Key/filter/page/Back/Forward/refetch/lỗi/race được unit/browser kiểm tra | Không còn blocker frontend xác định |
| C20 | 360/768/1280, bảng dài, modal focus/Escape/restore, toast/loading/error/skip-link đạt Chrome | Chưa Firefox/WebKit, screen reader, thiết bị thật |
| C21 | Build qua Express, asset/hash/refresh/URL sai/API JSON, thiếu build fixture, rollback Express thật đạt | Chưa deploy ngoài máy local; không có yêu cầu tự deploy |

### Hạn chế, đề xuất riêng và bàn giao

- **Chưa nghiệm thu đầy đủ migration.** Giai đoạn 8 đã triển khai cấu hình, sửa lỗi frontend xác định và kiểm tra production/rollback; không đánh dấu các ca ghi chưa chạy thành đạt. Tiếp theo cần môi trường development/test đã xác định và dữ liệu riêng cho C09–C18/đổi mật khẩu. Test quản trị opt-in có sẵn; nhập điểm/import cần thống nhất lớp/SV thử, vì API không có xóa enrollment, không tự cleanup bằng SQL/seed/reset.
- **B02 là blocker quyền cần quyết định backend riêng:** [gradesController](../be/controllers/gradesController.js) có thể lấy teacherId undefined khi TEACHER thiếu hồ sơ; [gradeModel](../be/models/gradeModel.js) chỉ lọc teacher khi ID truthy. Đề xuất từ chối 403 trước import khi thiếu hồ sơ, kèm test thiếu profile/ngoài lớp/trong lớp. Không sửa controller/model hoặc mô phỏng quyền bằng UI trong giai đoạn 8. B01/B03/B04 vẫn như baseline, không âm thầm thay hợp đồng.
- Chưa thử đổi hash thủ công ngoài history do router quản lý; đã thử menu, Back/Forward, local selectors và refresh/beforeunload thực tế. Import guard giữ kết quả với điều hướng SPA chủ động; việc buộc đóng tab/mất phiên/mất mạng vẫn có thể xảy ra sau server commit, không có API hủy toàn file hoặc tự retry.
- Không thay dependencies; không chạy lại audit trong đợt này. Chưa kiểm tra Firefox/WebKit, screen reader, hộp thoại in OS/máy in vật lý hoặc từng trang PDF. Không tự deploy, commit hay push.

Chạy/xem từ root: `npm.cmd --prefix fe-react run build`, rồi `npm.cmd --prefix be run start:react -- 3001`; mở http://localhost:3001/#/login. Dừng bằng Ctrl+C. Để rollback cùng cổng: `npm.cmd --prefix be run start:legacy -- 3001`. Backend mặc định vẫn là legacy ở 3000; các server test 5180/5181/5192 tự dừng sau test. Xem [README](../README.md) cho cấu hình dài hạn và ưu tiên biến môi trường.
