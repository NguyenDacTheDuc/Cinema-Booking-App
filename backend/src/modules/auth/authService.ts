import bcrypt from 'bcrypt';
import { Prisma, User } from '@prisma/client';
import prisma from '../../config/prisma';
import { signToken } from '../../utils/jwt';
import { AppError } from '../../utils/appError';
import { RegisterInput, LoginInput, UpdateProfileInput, PasswordChangeInput } from './authValidator';

const SALT_ROUNDS = 10;

// Không bao giờ trả passwordHash ra ngoài client
function toSafeUser(user: User) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

// "2004-11-22" -> Date 2004-11-22T00:00:00.000Z (để ghi vào cột DATE)
function toDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function register(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  try {
    // Đăng ký chỉ cần các thông tin bắt buộc.
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        phone: input.phone,
        dateOfBirth: toDateOnly(input.dateOfBirth),
      },
    });

    const token = signToken({ userId: user.id, role: user.role });
    return { token, user: toSafeUser(user) };
  } catch (err) {
    // P2002: vi phạm ràng buộc unique (email đã tồn tại).
    // Để database tự chặn trùng email thay vì "kiểm tra trước rồi mới tạo",
    // tránh race condition khi 2 request đăng ký cùng 1 email cùng lúc.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError('Email này đã được đăng ký', 409);
    }
    throw err;
  }
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Dùng chung 1 thông báo cho cả "sai email" và "sai mật khẩu",
  // không để lộ cho người ngoài biết email nào đã tồn tại trong hệ thống
  if (!user) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }

  const isMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }

  if (user.status !== 'active') {
    throw new AppError('Tài khoản đã bị khóa', 403);
  }

  const token = signToken({ userId: user.id, role: user.role });
  return { token, user: toSafeUser(user) };
}

export async function getProfile(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('Không tìm thấy người dùng', 404);
  }
  return toSafeUser(user);
}

export async function updateProfile(userId: number, input: UpdateProfileInput) {
  // Chỉ đưa vào những trường thực sự được gửi lên, bỏ qua trường undefined
  // (bắt buộc vì tsconfig bật exactOptionalPropertyTypes)
  const data: Prisma.UserUpdateInput = {};
  if (input.fullName !== undefined) data.fullName = input.fullName;
  if (input.avatar !== undefined) data.avatar = input.avatar;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.gender !== undefined) data.gender = input.gender;
  // Validator trả ngày sinh dạng chuỗi "YYYY-MM-DD", đổi sang Date trước khi lưu
  if (input.dateOfBirth !== undefined) data.dateOfBirth = toDateOnly(input.dateOfBirth);

  const user = await prisma.user.update({ where: { id: userId }, data });
  return toSafeUser(user);
}

export async function changePassword(userId: number, input: PasswordChangeInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('Không tìm thấy người dùng', 404);
  }

  // Phải nhập đúng mật khẩu đang dùng mới được đổi (phòng trường hợp người khác dùng máy đang đăng nhập sẵn).
  // Trả 400 chứ không phải 401: người dùng vẫn đăng nhập hợp lệ, chỉ là nhập sai mật khẩu cũ
  const isMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Mật khẩu hiện tại không đúng', 400);
  }

  const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return { message: 'Đổi mật khẩu thành công' };
}
