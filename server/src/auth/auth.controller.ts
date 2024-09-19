import { Controller, Post, Body, HttpCode, HttpException, UsePipes, ValidationPipe, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UsePipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) => {
      const messages = errors.map(error => 
        Object.values(error.constraints).join(', ')
      );
      return new BadRequestException(messages.join('. '));
    }
  }))
  async register(@Body() registerDto: RegisterDto) {
    try {
      const result = await this.authService.register(registerDto);
      
      if (result.user) {
        return { message: result.message, userId: result.user.id };
      } else {
        return { message: result.message };  
      }
    } catch (error) {
      throw new HttpException(error.message, error.status || 400);
    }
  }

  @Post('login')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(loginDto);
      return { message: result.message, accessToken: result.accessToken };
    } catch (error) {
      throw new HttpException(error.message, error.status || 401);
    }
  }
}
