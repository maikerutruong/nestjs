import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';
import { CreateUserDto } from './create-user.dto';
import { User, UserDocument } from './user.model';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async create(
    createUserDto: CreateUserDto,
  ): Promise<{ user: User; token: string }> {
    const hashedPassword: string = await bcrypt.hash(createUserDto.password, 8);
    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      tokens: [],
    });

    const user = await createdUser.save();

    const payload: { _id: string } = { _id: user._id.toString() };
    const token: string = this.jwtService.sign(payload);

    user.tokens.push(token);
    await user.save();

    return { user, token };
  }

  async login(user: UserDocument): Promise<{ user: User; token: string }> {
    const payload: { _id: string } = { _id: user._id.toString() };
    const token: string = this.jwtService.sign(payload);

    user.tokens.push(token);
    await user.save();

    return { user, token };
  }

  async validateUser(email: string, password: string) {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new Error('Unable to login');
    }

    const matched: boolean = await bcrypt.compare(password, user.password);

    if (!matched) {
      throw new Error('Unable to login');
    }

    return user;
  }
}
