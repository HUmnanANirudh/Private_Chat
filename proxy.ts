import { NextRequest,NextResponse } from "next/server";
import { redis } from "./app/lib/redis";

export const proxy = async(req: NextRequest) => {
    const pathname = req.nextUrl.pathname;

    const roomIdMatch = pathname.match(/^\/room\/([^\/]+)/);

    if(!roomIdMatch){
        return NextResponse.redirect(new URL("/", req.url));
    }

    const roomId = roomIdMatch[1];
    const meta = await redis.hgetall<{connected: string[] | string,createdAt: number,expiresAt: number}>(`meta:${roomId}`);
    if(!meta){
        return NextResponse.redirect(new URL("/errors/room-not-found", req.url));
    }

    const connected = typeof meta.connected === 'string' ? JSON.parse(meta.connected) : meta.connected;
    const existingTokens =req.cookies.get("x-auth-token")?.value;

    if(existingTokens && connected.includes(existingTokens)){
        return NextResponse.next();
    }

    if(connected.length >=2){
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

    let connectedUpdated =  await redis.hget<string[] | string>(`meta:${roomId}`,'connected');
    if (typeof connectedUpdated === 'string') {
        try {
            connectedUpdated = JSON.parse(connectedUpdated);
        } catch (e) {
            // fallback if it's not JSON
        }
    }

    await redis.hset(`meta:${roomId}`,{
        ...meta,
        connected: JSON.stringify([...(connectedUpdated as string[] || []),token]),
    });

    return respone;

}

export const config = {
    matcher: ['/room/:path*'],
}