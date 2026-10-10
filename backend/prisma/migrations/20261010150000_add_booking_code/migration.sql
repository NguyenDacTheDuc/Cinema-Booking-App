-- Thêm mã đặt vé cho bảng Booking.
-- Các đơn đã có trước đó được cấp mã theo id (CB000001, CB000002...) để không phải xóa dữ liệu cũ.
-- Đơn mới do backend sinh mã ngẫu nhiên không có số 0 và 1 nên không bao giờ trùng với các mã này.

-- 1. Thêm cột, tạm cho phép rỗng
ALTER TABLE `Booking` ADD COLUMN `bookingCode` VARCHAR(12) NULL;

-- 2. Cấp mã cho các đơn cũ
UPDATE `Booking`
SET
    `bookingCode` = CONCAT('CB', LPAD(`id`, 6, '0'))
WHERE
    `bookingCode` IS NULL;

-- 3. Bắt buộc có mã và không được trùng
ALTER TABLE `Booking` MODIFY `bookingCode` VARCHAR(12) NOT NULL;

CREATE UNIQUE INDEX `Booking_bookingCode_key` ON `Booking` (`bookingCode`);