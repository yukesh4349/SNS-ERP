import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { MessagingService } from './messaging.service';

@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('groups')
  async getGroups(@Req() req: any) {
    return this.messagingService.getGroups(req.user.sub);
  }

  @Get('messages/:groupId')
  async getMessages(@Param('groupId') groupId: string) {
    return this.messagingService.getMessages(groupId);
  }

  @Post('groups')
  async createGroup(
    @Req() req: any,
    @Body() body: { name: string; description: string },
  ) {
    return this.messagingService.createGroup(
      body.name,
      body.description,
      req.user.sub,
    );
  }

  @Post('groups/:groupId/members')
  async addMember(
    @Param('groupId') groupId: string,
    @Body() body: { userId: string },
  ) {
    return this.messagingService.addMember(groupId, body.userId);
  }

  @Post('send')
  async sendMessage(
    @Req() req: any,
    @Body() body: { groupId: string; text: string },
  ) {
    return this.messagingService.sendMessage(req.user.sub, body.groupId, body.text);
  }
}
