import { Strategy } from 'passport-custom';
import { AuthService } from '../auth.service';
declare const TelegramStrategy_base: new () => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class TelegramStrategy extends TelegramStrategy_base {
    private readonly authService;
    constructor(authService: AuthService);
    validate(req: any): Promise<any>;
}
export {};
