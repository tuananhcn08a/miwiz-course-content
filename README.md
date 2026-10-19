# miwiz-course-content

Nội dung tab **Khoá học** của app Miwiz, phát hành tĩnh qua GitHub Pages. App tải `index.json` khi mở, khoá nào đổi thì tải lại file khoá đó; không cần phát hành app mới.

- `catalog.json` — **file duy nhất sửa tay**: thứ tự khoá, bật/tắt khoá.
- `courses/<id>.json` — manifest từng khoá (schema = `docs/01-specs/features/course-roadmap/api-contract.md` §2 trong repo `miwiz-mobile`: `id, title, subtitle, thumbnail, field_id, level, language, icon_text, icon_color, days[], topics[]`).
- `index.json` — **sinh tự động**, không sửa tay (GitHub Actions chạy sau mỗi push; chạy tay: `node scripts/build-index.mjs`).

Khoá **offline** (học tại Miwiz Mind Hub):

- `offline/catalog.json` — sửa tay (hoặc qua trang quản trị, tab *Khoá offline*): thứ tự + bật/tắt khoá offline, mỗi dòng `{ "id": "<id>", "enabled": true }`.
- `offline/courses.json` — nội dung đầy đủ (providers, textbooks, courses); ảnh bìa ở `offline/covers/`.
- `offline/index.json` — **sinh tự động** từ 2 file trên (cùng lệnh `node scripts/build-index.mjs`): thứ tự theo `offline/catalog.json`, `enabled` lấy từ đó; khoá có trong `courses.json` mà quên khai báo thì thêm vào cuối, đang ẩn; id lạ trong catalog = lỗi. App đọc file này: thứ tự mảng = thứ tự hiển thị, `enabled:false` = ẩn.

## Việc thường làm

| Muốn | Làm |
|---|---|
| Đổi thứ tự khoá | Đổi thứ tự dòng trong `catalog.json` → push |
| Ẩn / hiện khoá | `enabled: false` / `true` trong `catalog.json` → push (tiến độ người học vẫn giữ) |
| Thêm khoá | Thêm `courses/<id>.json` + 1 dòng `{ "id": "<id>", "enabled": true }` → push |
| Gom lại chủ điểm, đổi tên, đổi ảnh bìa | Sửa trong `courses/<id>.json` → push |
| Kiểm trước khi push | `node scripts/build-index.mjs` (báo lỗi: id trùng, thiếu file, ngày lặp, topic rỗng) |

Id khoá / ngày / mục (`lesson:…`, `deck:…`, `test:…`) **không được đổi** sau khi đã phát hành: tiến độ người học gắn theo các id này.

## Trang quản trị

Ẩn/hiện và đổi thứ tự khoá ngay trên điện thoại (dùng khi demo): **https://tuananhcn08a.github.io/miwiz-course-content/admin/**

Có 2 tab: **Khoá online** (sửa `catalog.json`) và **Khoá offline** (sửa `offline/catalog.json`, commit "admin: cập nhật khoá offline"). Trang nhớ tab đang chọn; tab nào có thay đổi chưa lưu thì có chấm cam, chuyển tab/rời trang sẽ hỏi trước.

- Bấm công tắc **Hiển thị**, mũi tên ▲▼ để đổi thứ tự, hoặc nút nhanh *Chỉ 1 khoá/môn (chỉ tab online) · Hiện tất cả · Ẩn tất cả* → **Lưu thay đổi**.
- Lưu = sửa `catalog.json` / `offline/catalog.json` trên GitHub → Actions sinh lại `index.json` / `offline/index.json` → Pages cập nhật (thường 1–2 phút). Trang hiện từng bước; xong thì mở lại app.
- Cần mã truy cập GitHub (làm 1 lần): mở https://github.com/settings/personal-access-tokens/new → *Repository access*: **Only select repositories** → `miwiz-course-content` → *Permissions*: **Contents: Read and write** (Metadata tự bật) → *Expiration*: 90 days → Generate, dán mã vào trang, tích "Nhớ trên máy này". Hết hạn thì tạo mã mới, bấm "Quên token" rồi dán lại.
- Không có mã vẫn xem được danh sách, chỉ không lưu được.

## App đọc thế nào (hợp đồng)

- `GET index.json` (ETag) → `courses[]` **theo đúng thứ tự mảng** là thứ tự hiển thị; `enabled:false` → ẩn.
- Khoá có `version`/`sha256` khác bản đã lưu → tải `manifestUrl` (tương đối với thư mục chứa `index.json`), kiểm `sha256`, lưu cache.
- Không mạng / lỗi / `schemaVersion` lớn hơn app hỗ trợ → dùng cache; chưa có cache → dùng bản đóng trong app.
- `minAppVersion` (tuỳ chọn): app cũ hơn thì bỏ qua index mới, giữ bản đang có.

## Địa chỉ

- Pages: `https://tuananhcn08a.github.io/miwiz-course-content/index.json`
- Sau này có API chính thức (`/v1/course*` trên miwiz-web-new hoặc miwiz-api) thì app chỉ đổi base URL, schema giữ nguyên.
