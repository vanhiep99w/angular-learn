# Docs-kit 0.9.0 — kiểm kê và xác minh

## Mục lục

- [Phạm vi](#phạm-vi)
- [Kiểm kê](#kiểm-kê)
- [Kiểm thử](#kiểm-thử)
- [Hạn chế](#hạn-chế)

## Phạm vi

Tiếp tục các thay đổi dang dở trong repo này. Pin package đã phát hành `@vanhiep99w/docs-kit@0.9.0` từ npm, không dùng checkout `../docs-kit` hoặc API của version khác. Giữ nguyên Next.js, React, Fumadocs, output static `dist`, 87 đường dẫn nội dung/metadata, toàn bộ frontmatter và `meta.json`.

Production remark pipeline dùng chung ở `scripts/docs-plugins.mjs`; MDX registry và CSS đăng ký D2, D2 interactive, CodeWalkthrough, CodeDiff, TerminalSession, ProtocolExchange và SpanWaterfall. Các ví dụ được dùng ở bài Angular CLI, HttpClient và profiling, không chèn component chỉ để trang trí.

Checkout này không có Source Explorer provider, manifest, generator hoặc SourceRef trước migration. Không thêm một hệ thống source mới và không thay route, loader, layout hay search integration hiện có.

## Kiểm kê

- 76 trang MDX; 242 D2 fences trên 72 trang, gồm 204 fences có sẵn và 38 fences thay cho 29 sơ đồ text cũ. Các sơ đồ dài được tách với node nối tiếp lặp lại, không thu nhỏ font để giấu overflow.
- Không còn Mermaid fence/JSX/import hay sơ đồ ASCII/Unicode chưa chuyển trong nội dung được kiểm kê.
- `scripts/diagram-migration-baseline.json`: vị trí, caption và SHA-256 của 29 sơ đồ gốc; caption vẫn truy ngược được dù sơ đồ được tách.
- `scripts/reviewed-text-artifacts.json`: 29 artifact giữ nguyên, gồm 27 text fences và 2 TypeScript fences có ký tự mũi tên. Đây là cây thư mục, cú pháp `[(ngModel)]` theo vị trí, trạng thái binding, URL, cấu hình, hướng dẫn tái hiện hoặc diagnostic/log thực trong ví dụ; không phải sơ đồ. Mỗi ngoại lệ khóa theo file, language, checksum và lý do; nội dung thay đổi phải review lại.
- `scripts/audit-diagrams.mjs`: parse MDX (cả backtick và tilde fences), kiểm tra Mermaid, graphic glyphs, text fences mới và các cạnh sơ đồ ngoài fence. Chạy cả trong prebuild. Đây là guard hồi quy có review, không phải bằng chứng tự động rằng mọi hình đều đúng semantics.
- Chrome icon lấy từ URL catalog đã kiểm tra, được review/vendoring với license và checksum trong `content/images/README.md`. Nhúng vào cả SVG themes lúc build, không cần tải catalog lúc đọc. Không dùng AngularJS logo để chỉ modern Angular.

## Kiểm thử

Các lệnh đã chạy thành công sau `npm ci`:

```bash
npm run check:diagrams
npm test
npm run typecheck
npm run build
npm run test:browser
```

- 14 Node tests: compile toàn bộ 242 D2 bằng production plugins, themed SVG, ID riêng, kích thước, descriptor validation, registry/CSS/schema, migration ledger, audit âm tính và icon embedding.
- 7 Chromium smoke tests trên static export: mở cả 76 URL, đếm diagram, không có pageerror hoặc catalog request; light/dark ở 1280px và 390px; walkthrough steps/highlights/copy, diff view/copy, HTTP error variant/copy, D2 zoom/expand/Escape, terminal copy/notes và span attributes.
- Không JavaScript: SVG, walkthrough explanations, diff, HTTP variants, terminal notes và bảng thời gian vẫn đọc được.
- Kiểm tra source đối chiếu Git xác nhận frontmatter, metadata và đường dẫn không đổi; client output không có D2 build renderer hoặc `.wasm`.
- `git diff --check` không có lỗi whitespace. Browser screenshots và build/cache chỉ là artifact local, không commit.

## Hạn chế

- Chỉ xác minh local/static export và Chromium; chưa kiểm tra production Cloudflare, Firefox/WebKit, mọi lab Angular hoặc độ chính xác kỹ thuật của toàn bộ bài học.
- Sơ đồ rộng và code dài chủ đích dùng vùng cuộn ngang trên mobile, không thu nhỏ chữ.
- Build có hai warning CSS optimizer của Fumadocs với `::highlight(fd-search)`; build vẫn thành công.
- `npm ci`/`npm audit` báo 5 high advisories: `miniflare`, `sharp`, `source-map-js`, `undici`, `wrangler` trong dependency tree. Không chạy `npm audit fix` vì cần giữ stack và tránh nâng package ngoài phạm vi migration. Cần remediation riêng và kiểm thử lại.
- Npm cũng cảnh báo install-script approval của esbuild/workerd; `npm ci`, typecheck, tests và build vẫn thành công trong môi trường kiểm tra này.
- Nội dung HTTP, terminal và timing trong component là ví dụ/expected behavior, không phải request đã gửi, lệnh Angular đã chạy hay benchmark thực đo.
