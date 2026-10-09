import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const DEFAULT_SEAT_TYPE_ID = 1;

async function seedDefaultSeatType() {
  // upsert theo name (cột name có @unique): chạy seed nhiều lần vẫn chỉ có
  // đúng 1 loại "thường". update để trống nhằm không ghi đè giá mà Admin
  // đã sửa trên web.
  const seatType = await prisma.seatType.upsert({
    where: { name: 'thường' },
    update: {},
    create: {
      name: 'thường',
      price: 50000,
    },
  });

  // Module room gán cứng seatTypeId = 1 cho mọi ghế mới sinh ra,
  // nên loại "thường" bắt buộc phải có id = 1.
  if (seatType.id !== DEFAULT_SEAT_TYPE_ID) {
    console.warn(`Cảnh báo: loại ghế "thường" đang có id = ${seatType.id}, không phải ${DEFAULT_SEAT_TYPE_ID}. ` + 'Hãy chạy "npx prisma migrate reset" để database bắt đầu lại từ đầu.');
  }

  console.log(`Loại ghế mặc định: ${seatType.name} (id: ${seatType.id}, giá: ${seatType.price})`);
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  // Không ghi cứng email/mật khẩu admin trong code, vì file này sẽ được
  // đẩy lên GitHub public. Thông tin thật chỉ nằm trong .env (đã bị ẩn).
  if (!email || !password) {
    throw new Error('Thiếu ADMIN_EMAIL hoặc ADMIN_PASSWORD trong file .env');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // upsert: nếu email đã tồn tại thì chỉ đảm bảo role là admin,
  // chưa có thì tạo mới. Nhờ vậy chạy seed nhiều lần không bị lỗi trùng email.
  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'admin' },
    create: {
      email,
      passwordHash,
      role: 'admin',
      gender: 'male',
      phone: '0000000000',
      fullName: 'Thế Đức',
      dateOfBirth: new Date('2000-01-01'),
    },
  });

  console.log(`Tài khoản admin: ${admin.email} (id: ${admin.id})`);
}

async function main() {
  // seedDefaultSeatType phải chạy đầu tiên để loại "thường" nhận id = 1
  await seedDefaultSeatType();
  await seedAdmin();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
