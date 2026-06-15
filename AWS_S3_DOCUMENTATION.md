# Hướng dẫn Cấu hình & Thiết lập AWS S3 (AWS Console Setup Guide)

Tài liệu này hướng dẫn chi tiết từng bước thao tác trên giao diện điều khiển **AWS Console** để tạo mới một S3 Bucket, thiết lập quyền hạn và tạo khóa bảo mật kết nối cho ứng dụng **CloudStudy**.

---

## 1. Quy trình thiết lập trên AWS Console (Từng bước chi tiết)

Để ứng dụng kết nối thành công tới AWS S3, bạn cần thực hiện 4 bước lớn trên trang quản trị AWS:

### Bước 1: Tạo mới một S3 Bucket
1. Đăng nhập vào **[AWS Management Console](https://aws.amazon.com/console/)**.
2. Tìm kiếm dịch vụ **S3** trên thanh tìm kiếm và chọn **S3**.
3. Nhấp vào nút **Create bucket** (Tạo bucket).
4. Điền các thông tin:
   * **Bucket name:** Nhập tên duy nhất cho bucket (ví dụ: `cloudstudy-2026`). Tên này không được trùng lặp với bất kỳ bucket nào khác trên toàn cầu.
   * **AWS Region:** Chọn khu vực địa lý đặt máy chủ S3. Khuyên dùng khu vực gần nhất để tối ưu tốc độ (ví dụ: `ap-southeast-2` - Sydney hoặc `ap-southeast-1` - Singapore).
   * **Object Ownership:** Giữ nguyên mặc định là **ACLs disabled** (Khuyên dùng vì bảo mật tốt hơn).
5. **Block Public Access settings for this bucket:**
   * **Tích chọn "Block all public access"** (Chặn toàn bộ quyền truy cập công khai).
   * *Lưu ý quan trọng:* Vì lý do an toàn thông tin tài liệu học tập của sinh viên, chúng ta tuyệt đối không mở công khai tệp tin ra Internet. Máy chủ Node.js sẽ làm trung gian phân quyền và lấy tệp tin về dưới dạng luồng dữ liệu (Stream) để phục vụ xem trước hoặc tải xuống.
6. Nhấp vào nút **Create bucket** ở cuối trang để hoàn tất tạo.

---

### Bước 2: Tạo chính sách truy cập IAM (IAM Policy)
Chính sách này định nghĩa những hành động mà máy chủ của chúng ta được phép thực hiện trên S3 Bucket (chỉ cho phép Đọc, Ghi và Xóa tệp, không cho phép xóa Bucket).

1. Trên thanh tìm kiếm AWS Console, tìm dịch vụ **IAM** (Identity and Access Management).
2. Ở cột menu bên trái, nhấp chọn **Policies** -> Nhấp vào nút **Create policy**.
3. Chọn tab **JSON** và dán đoạn chính sách phân quyền sau vào (thay thế `cloudstudy-2026` bằng tên bucket bạn vừa tạo):
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Sid": "CloudStudyS3Access",
               "Effect": "Allow",
               "Action": [
                   "s3:PutObject",
                   "s3:GetObject",
                   "s3:DeleteObject"
               ],
               "Resource": [
                   "arn:aws:s3:::cloudstudy-2026",
                   "arn:aws:s3:::cloudstudy-2026/*"
               ]
           }
       ]
   }
   ```
4. Nhấn **Next: Tags** rồi **Next: Review**.
5. Đặt tên cho chính sách này ở ô **Name** (ví dụ: `CloudStudyS3Policy`).
6. Nhấp nút **Create policy** để lưu lại.

---

### Bước 3: Tạo người dùng IAM và Lấy khóa bảo mật (Access Key)
Người dùng IAM này sẽ đại diện cho máy chủ Node.js để kết nối với S3 qua các khóa bảo mật được cấp.

1. Vẫn ở giao diện dịch vụ **IAM**, nhấp chọn **Users** ở menu bên trái -> Nhấp nút **Add users** (Thêm người dùng).
2. Điền thông tin:
   * **User name:** Đặt tên người dùng (ví dụ: `cloudstudy-server`).
   * *Không* tích chọn quyền truy cập AWS Management Console (để giữ an toàn, tài khoản này chỉ dùng để kết nối API).
   * Nhấn **Next**.
3. **Set permissions (Gán quyền):**
   * Chọn ô **Attach policies directly** (Gán trực tiếp chính sách).
   * Tìm kiếm tên chính sách bạn vừa tạo ở Bước 2 (`CloudStudyS3Policy`) và tích chọn nó.
   * Nhấn **Next** -> Nhấp nút **Create user**.
4. **Tạo Access Key để kết nối:**
   * Sau khi tạo xong người dùng, click vào tên người dùng đó (`cloudstudy-server`) trong danh sách.
   * Chọn tab **Security credentials** (Thông tin xác thực bảo mật).
   * Cuộn xuống tìm mục **Access keys** và nhấp nút **Create access key**.
   * Chọn mục đích sử dụng là **Application running outside AWS** (Ứng dụng chạy ngoài AWS) -> Nhấn **Next**.
   * Đặt nhãn mô tả tùy ý rồi nhấn **Create access key**.
5. **Lưu trữ mã khóa:**
   * Hệ thống sẽ hiển thị hai thông tin cực kỳ quan trọng:
     * **Access key ID:** Dạng chuỗi chữ viết hoa (ví dụ: `AKIA...`)
     * **Secret access key:** Dạng chuỗi ký tự bí mật dài.
   * *Chú ý:* Bạn cần tải tệp `.csv` chứa các khóa này về máy hoặc copy lưu lại ngay lập tức, vì đây là lần đầu tiên và duy nhất AWS hiển thị mã khóa bí mật này.

---

### Bước 4: Thiết lập cấu hình CORS trên S3 Bucket (Cho phép tải & xem trước)
Cấu hình CORS (Cross-Origin Resource Sharing) cho phép trình duyệt của người dùng gửi yêu cầu lấy tệp tin trực tiếp từ S3 hoặc thực hiện các hoạt động stream mượt mà mà không bị trình duyệt chặn bảo mật chéo tên miền.

1. Quay trở lại dịch vụ **S3** -> Nhấp chọn tên bucket của bạn (`cloudstudy-2026`).
2. Chọn tab **Permissions** (Quyền hạn).
3. Cuộn xuống dưới cùng tìm mục **Cross-origin resource sharing (CORS)** và nhấp vào nút **Edit**.
4. Dán đoạn cấu hình CORS chuẩn sau vào:
   ```json
   [
       {
           "AllowedHeaders": [
               "*"
           ],
           "AllowedMethods": [
               "GET",
               "PUT",
               "POST",
               "DELETE",
               "HEAD"
           ],
           "AllowedOrigins": [
               "*"
           ],
           "ExposeHeaders": [
               "ETag",
               "Content-Type",
               "Content-Length",
               "Content-Disposition"
           ],
           "MaxAgeSeconds": 3000
       }
   ]
   ```
   *(Lưu ý: Sau khi bạn deploy dự án thực tế lên Render có link dạng `https://cloudstudy-1.onrender.com`, bạn có thể thay thế dấu `*` ở ô `AllowedOrigins` bằng đường link Render đó để tăng tính bảo mật).*
5. Nhấp nút **Save changes** để hoàn tất.

---

## 2. Liên kết các thông số bảo mật vào dự án

Sau khi hoàn thành 4 bước cài đặt trên AWS Console, bạn hãy điền chính xác các giá trị vào tệp tin cấu hình [**`.env`**](file:///f:/CloudStudy/.env) ở thư mục gốc của dự án để ứng dụng chạy:

*   `AWS_REGION`: Điền mã khu vực máy chủ S3 đã chọn ở Bước 1 (ví dụ: `ap-southeast-2`).
*   `AWS_ACCESS_KEY_ID`: Điền chuỗi Access Key ID đã lấy ở Bước 3.
*   `AWS_SECRET_ACCESS_KEY`: Điền chuỗi Secret Access Key đã lấy ở Bước 3.
*   `AWS_BUCKET_NAME`: Điền tên Bucket S3 đã tạo ở Bước 1 (ví dụ: `cloudstudy-2026`).

Ứng dụng Node.js sẽ tự động kết nối và tương tác bảo mật với đám mây AWS S3 của bạn dựa trên các thông số này!
