import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/auth.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { TeacherQuestionBankService } from './teacher-question-bank.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionBankQueryDto } from './dto/question-bank.dto';

@ApiTags('Teacher - Question Bank')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER)
@Controller('teacher/question-bank')
export class TeacherQuestionBankController {
  constructor(private readonly questionBankService: TeacherQuestionBankService) {}

  @Get()
  @ApiOperation({ summary: 'List and filter questions in the question bank' })
  getQuestions(
    @Query() queryDto: QuestionBankQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.questionBankService.getQuestions(user.tenantId, queryDto);
  }

  @Get('random')
  @ApiOperation({ summary: 'Get random questions matching criteria for assessment generation' })
  @ApiQuery({ name: 'count', required: false, type: Number, description: 'Number of random questions to return' })
  getRandomQuestions(
    @Query() filters: QuestionBankQueryDto,
    @Query('count') count: number = 5,
    @CurrentUser() user: any,
  ) {
    const limit = Number(count) || 5;
    return this.questionBankService.getRandomQuestions(filters, limit, user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a single question by ID' })
  getQuestionById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.questionBankService.getQuestionById(id, user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new question in the question bank' })
  createQuestion(@Body() dto: CreateQuestionDto, @CurrentUser() user: any) {
    return this.questionBankService.createQuestion(dto, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a question and replace its options' })
  updateQuestion(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
    @CurrentUser() user: any,
  ) {
    return this.questionBankService.updateQuestion(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a question from the question bank' })
  deleteQuestion(@Param('id') id: string, @CurrentUser() user: any) {
    return this.questionBankService.deleteQuestion(id, user.tenantId);
  }
}
