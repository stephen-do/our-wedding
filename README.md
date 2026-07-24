# Thiệp Cưới Online

Trang thiệp cưới đơn giản, một trang (HTML/CSS/JS thuần, không cần build), sẵn sàng deploy miễn phí lên GitHub Pages.

## Cấu trúc project

```
.
├── index.html      # Nội dung thiệp
├── css/style.css   # Giao diện
├── js/script.js    # Đếm ngược
└── images/         # Ảnh cưới (tự thêm)
```

## 1. Tuỳ chỉnh nội dung

Mở `index.html` và sửa:

- Tên cô dâu/chú rể, ngày cưới ở phần `.hero` và `.footer`.
- Ngày giờ đếm ngược: sửa `data-wedding-date="2027-02-14T09:00:00"` trong thẻ `#countdown-clock` (nằm ở cuối slide RSVP `#finale`).
- Lời ngỏ ở phần `.story`.
- Giờ giấc, địa điểm lễ vu quy / nhà trai ở phần `.ticket-legs` trong slide đầu (`#hero`).
- Link chỉ đường: thay `href` của các thẻ `.btn-direction` bằng link Google Maps của địa điểm thật (mở Google Maps → tìm địa điểm → Share → Copy link).
- Ảnh: bỏ ảnh thật vào thư mục `images/`, sửa `src` trong phần `.gallery` (ví dụ `images/anh-1.jpg`).
- RSVP: tạo một [Google Form](https://forms.google.com) đơn giản (họ tên, số lượng người tham dự, lời nhắn), lấy link rồi thay vào nút "RSVP ngay".

## 2. Xem thử trên máy

Chỉ cần mở trực tiếp `index.html` bằng trình duyệt, hoặc chạy local server:

```bash
python3 -m http.server 8000
```

rồi mở `http://localhost:8000`.

## 3. Deploy lên GitHub Pages

```bash
git init
git add .
git commit -m "Initial wedding invitation"
git branch -M main
git remote add origin https://github.com/<username>/<repo-name>.git
git push -u origin main
```

Sau đó vào repo trên GitHub → **Settings > Pages**:

- **Source**: Deploy from a branch
- **Branch**: `main`, thư mục `/ (root)`
- Save

Sau ít phút, trang sẽ có ở địa chỉ:

```
https://<username>.github.io/<repo-name>/
```

> Mẹo: nếu muốn link gọn hơn (không có `/<repo-name>`), đặt tên repo đúng là `<username>.github.io`.

## 4. Chia sẻ

Copy link GitHub Pages ở trên gửi cho mọi người qua tin nhắn, Zalo, Facebook...
