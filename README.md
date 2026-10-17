# miwiz-course-content

Nội dung tab **Khoá học** của app Miwiz, phát hành tĩnh qua GitHub Pages. App tải `index.json` khi mở, khoá nào đổi thì tải lại file khoá đó; không cần phát hành app mới.

- `catalog.json` — **file duy nhất sửa tay**: thứ tự khoá, bật/tắt khoá.
- `courses/<id>.json` — manifest từng khoá (schema = `docs/01-specs/features/course-roadmap/api-contract.md` §2 trong repo `miwiz-mobile`: `id, title, subtitle, thumbnail, field_id, level, language, icon_text, icon_color, days[], topics[]`).
- `index.json` — **sinh tự động**, không sửa tay (GitHub Actions chạy sau mỗi push; chạy tay: `node scripts/build-index.mjs`).

## Việc thường làm

| Muốn | Làm |
|---|---|
| Đổi thứ tự khoá | Đổi thứ tự dòng trong `catalog.json` → push |
| Ẩn / hiện khoá | `enabled: false` / `true` trong `catalog.json` → push (tiến độ người học vẫn giữ) |
| Thêm khoá | Thêm `courses/<id>.json` + 1 dòng `{ "id": "<id>", "enabled": true }` → push |
| Gom lại chủ điểm, đổi tên, đổi ảnh bìa | Sửa trong `courses/<id>.json` → push |
| Kiểm trước khi push | `node scripts/build-index.mjs` (báo lỗi: id trùng, thiếu file, ngày lặp, topic rỗng) |

Id khoá / ngày / mục (`lesson:…`, `deck:…`, `test:…`) **không được đổi** sau khi đã phát hành: tiến độ người học gắn theo các id này.

## App đọc thế nào (hợp đồng)

- `GET index.json` (ETag) → `courses[]` **theo đúng thứ tự mảng** là thứ tự hiển thị; `enabled:false` → ẩn.
- Khoá có `version`/`sha256` khác bản đã lưu → tải `manifestUrl` (tương đối với thư mục chứa `index.json`), kiểm `sha256`, lưu cache.
- Không mạng / lỗi / `schemaVersion` lớn hơn app hỗ trợ → dùng cache; chưa có cache → dùng bản đóng trong app.
- `minAppVersion` (tuỳ chọn): app cũ hơn thì bỏ qua index mới, giữ bản đang có.

## Địa chỉ

- Pages: `https://tuananhcn08a.github.io/miwiz-course-content/index.json`
- Sau này có API chính thức (`/v1/course*` trên miwiz-web-new hoặc miwiz-api) thì app chỉ đổi base URL, schema giữ nguyên.
