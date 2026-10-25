
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type Context = {
  params: Promise<{ id: string }>;
};

export async function DELETE(
  request: Request,
  context: Context
) {
  try {
    const { id } = await context.params;
    const postId = Number(id);

    if (!Number.isSafeInteger(postId) || postId <= 0) {
      return NextResponse.json(
        { error: "올바르지 않은 게시글 번호입니다." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const password = body?.password;

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 72
    ) {
      return NextResponse.json(
        { error: "비밀번호를 확인해 주세요." },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    const { data: post, error: fetchError } = await admin
      .from("posts")
      .select("id, password_hash")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        { error: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (!post.password_hash) {
      return NextResponse.json(
        { error: "기존 게시글은 작성자 인증으로 삭제해야 합니다." },
        { status: 403 }
      );
    }


        
    // 비밀번호 추측 공격 방지를 위한 요청 횟수 제한
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim();

    if (!clientIp) {
      return NextResponse.json(
        { error: "접속 정보를 확인하지 못했습니다." },
        { status: 400 }
      );
    }

    const { data: allowed, error: limitError } = await admin.rpc(
      "check_post_password_attempt",
      {
        p_post_id: postId,
        p_client_key: clientIp,
      }
    );

    if (limitError) {
      console.error("비밀번호 시도 제한 오류:", limitError.message);

      return NextResponse.json(
        { error: "잠시 후 다시 시도해 주세요." },
        { status: 500 }
      );
    }

    if (!allowed) {
      return NextResponse.json(
        {
          error: "비밀번호 입력 횟수를 초과했어! 1시간 후 다시 시도해 줘.",
        },
        { status: 429 }
      );
    }


      
const passwordMatches = await bcrypt.compare(
  password,
  post.password_hash
);


    if (!passwordMatches) {
      return NextResponse.json(
        { error: "비밀번호가 일치하지 않습니다." },
        { status: 403 }
      );
    }

    
const { data: deletedPosts, error: deleteError } = await admin
  .from("posts")
  .delete()
  .eq("id", postId)
  .eq("password_hash", post.password_hash)
  .select("id");


    if (deleteError) {
      console.error("게시글 삭제 실패:", deleteError.message);

      return NextResponse.json(
        { error: "게시글을 삭제하지 못했습니다." },
        
        { status: 500 }
      );
    }

if (!deletedPosts || deletedPosts.length === 0) {
  return NextResponse.json(
    { error: "게시글이 삭제되지 않았어. 다시 시도해 줘!" },
    { status: 409 }
  );
}

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("게시글 삭제 오류:", error);

    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const postId = Number(id);

    if (!Number.isSafeInteger(postId) || postId <= 0) {
      return NextResponse.json(
        { error: "올바르지 않은 게시글이야." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { password, title, content, previewTitle } = body ?? {};

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 72 ||
      typeof title !== "string" ||
      title.trim().length < 1 ||
      title.trim().length > 200 ||
      typeof content !== "string" ||
      content.trim().length < 1 ||
      content.trim().length > 10000 ||
      (previewTitle != null &&
        (typeof previewTitle !== "string" || previewTitle.length > 200))
    ) {
      return NextResponse.json(
        { error: "입력 내용을 확인해 줘." },
        { status: 400 }
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim();

    if (!clientIp) {
      return NextResponse.json(
        { error: "접속 정보를 확인하지 못했어." },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    const { data: allowed, error: limitError } = await admin.rpc(
      "check_post_password_attempt",
      {
        p_post_id: postId,
        p_client_key: clientIp,
      }
    );

    if (limitError) {
      console.error("수정 시도 제한 오류:", limitError.message);
      return NextResponse.json(
        { error: "잠시 후 다시 시도해 줘." },
        { status: 500 }
      );
    }

    if (!allowed) {
      return NextResponse.json(
        { error: "비밀번호 입력 횟수를 초과했어. 1시간 후 다시 시도해 줘." },
        { status: 429 }
      );
    }

    const { data: post, error: fetchError } = await admin
      .from("posts")
      .select("id, password_hash")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        { error: "게시글을 찾을 수 없어." },
        { status: 404 }
      );
    }

    if (!post.password_hash) {
      return NextResponse.json(
        { error: "기존 게시글은 비밀번호 수정 기능을 사용할 수 없어." },
        { status: 403 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      post.password_hash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { error: "비밀번호가 일치하지 않아!" },
        { status: 403 }
      );
    }

    const { data: updatedPost, error: updateError } = await admin
      .from("posts")
      .update({
        title: title.trim(),
        preview_title: previewTitle?.trim() || null,
        content: content.trim(),
      })
      .eq("id", postId)
      .eq("password_hash", post.password_hash)
      .select("id")
      .single();

    if (updateError || !updatedPost) {
      console.error("게시글 수정 오류:", updateError?.message);
      return NextResponse.json(
        { error: "게시글을 수정하지 못했어." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("게시글 수정 서버 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했어." },
      { status: 500 }
    );
  }
}

