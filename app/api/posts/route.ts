
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { category, title, previewTitle, content, password } = body;

    if (
      typeof category !== "string" ||
      typeof title !== "string" ||
      typeof content !== "string" ||
      typeof password !== "string" ||
      title.trim().length < 1 ||
      title.trim().length > 200 ||
      content.trim().length < 1 ||
      content.trim().length > 10000 ||
      password.length < 8 ||
      password.length > 72
    ) {
      return NextResponse.json(
        { error: "입력 내용을 확인해 주세요." },
        { status: 400 }
      );
    }

    if (
      previewTitle != null &&
      (typeof previewTitle !== "string" ||
        previewTitle.length > 200)
    ) {
      return NextResponse.json(
        { error: "목록용 제목을 확인해 주세요." },
        { status: 400 }
      );
    }

    const allowedCategories = [
      "결혼/가족",
      "연애/사랑",
      "회사/인간 관계",
      "돈/소비",
      "진로/성공",
      "취향/라이프스타일",
    ];

    if (!allowedCategories.includes(category)) {
      return NextResponse.json(
        { error: "올바르지 않은 카테고리입니다." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    // 서버가 확인한 접속 IP를 기준으로 요청 제한
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim();

    if (!clientIp) {
      return NextResponse.json(
        { error: "접속 정보를 확인하지 못했습니다." },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    const { data: allowed, error: rateLimitError } =
      await admin.rpc("check_post_rate_limit", {
        p_client_key: clientIp,
      });

    if (rateLimitError) {
      console.error("요청 제한 확인 실패:", rateLimitError.message);

      return NextResponse.json(
        { error: "잠시 후 다시 시도해 주세요." },
        { status: 500 }
      );
    }

    if (!allowed) {
      return NextResponse.json(
        { error: "글은 1시간에 최대 5개까지 등록할 수 있어요." },
        { status: 429 }
      );
    }


    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("posts")
      .insert({
        category,
        title: title.trim(),
        preview_title: previewTitle?.trim() || null,
        content: content.trim(),
        password_hash: passwordHash,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("게시글 저장 실패:", error?.message);

      return NextResponse.json(
        { error: "게시글을 저장하지 못했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { id: data.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("게시글 작성 오류:", error);

    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
