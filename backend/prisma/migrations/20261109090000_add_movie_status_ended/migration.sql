-- Thêm trạng thái "ended" (đã chiếu) cho phim.
-- Chỉ mở rộng danh sách giá trị của ENUM, dữ liệu phim hiện có giữ nguyên.
ALTER TABLE `Movie`
MODIFY `status` ENUM(
    'coming_soon',
    'now_showing',
    'ended'
) NOT NULL DEFAULT 'coming_soon';