import { NextRequest,NextResponse } from "next/server";
import { redis } from "./app/lib/redis";

export const proxy = async(req: NextRequest) => {
    const pathname = req.nextUrl.pathname;

    const roomIdMatch = pathname.match(/^\/room\/([^\/]+)/);

    if(!roomIdMatch){
        return NextResponse.redirect(new URL("/", req.url));
    }

    const roomId = roomIdMatch[1];
    const meta = await redis.hgetall<{connected: string[],createdAt: number,expiresAt: number}>(`meta:${roomId}`);
    if(!meta){
        return NextResponse.redirect(new URL("/errors/not-found", req.url));
    }
    const existingTokens =req.cookies.get("x-auth-token")?.value;

    if(existingTokens && meta.connected.includes(existingTokens)){
        return NextResponse.next();
    }

    if(meta.connected.length >=2){
        return NextResponse.redirect(new URL("/errors/room-full", req.url));
    }
    
    const respone = NextResponse.next();

    const token = crypto.randomUUID().slice(0,32);
    respone.cookies.set(`x-auth-token`,token,{
        path:`/`,
        httpOnly:true,
        sameSite:"strict",
        secure:process.env.NODE_ENV === "production",
    })

    await redis.hset(`meta:${roomId}`,{
        ...meta,
        connected:[...meta.connected,token],
    });

    return respone;

}

export const config = {
    matcher: ['/room/:path*'],
}