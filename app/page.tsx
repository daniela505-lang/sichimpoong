
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
type Post = {
  id: number;
  category: string;
  title: string;
  
previewTitle?: string;

  content: string;
  views: number;
  likes: number;
  comments: string[];
  createdAt: string;
};

const categories = [
  "전체글",
  "BEST 글",
  "결혼/가족",
  "연애/사랑",
  "회사/인간 관계",
  "돈/소비",
  "진로/성공",
  "취향/라이프스타일",
];

const samplePosts: Post[] = [
  {
    id: 1,
    category: "연애&사랑",
    title: "남친이랑 3년째 연애 중인데 진짜 달라짐...",
    content: "남친이 원래 회피형이었는데 요즘 완전히 달라졌어. 다들 어떻게 생각해?",
    views: 1250,
    likes: 95,
    comments: ["진짜 많이 달라졌네", "대화해보는 게 좋을 듯"],
    createdAt: "10:32",
  },
  {
    id: 2,
    category: "결혼&가족",
    title: "결혼 준비하면서 처음 알게 된 사실",
    content: "결혼 준비가 생각보다 쉽지 않네. 다들 이런 경험 있어?",
    views: 980,
    likes: 72,
    comments: ["공감해요"],
    createdAt: "09:45",
  },
  {
    id: 3,
    category: "회사&인간관계",
    title: "회사에서 이런 말 들으면 기분 어떨 것 같아?",
    content: "오늘 회사에서 조금 당황스러운 말을 들었어.",
    views: 740,
    likes: 54,
    comments: ["나라면 기분 나쁠 듯"],
    createdAt: "09:12",
  },
  {
    id: 4,
    category: "돈&소비",
    title: "월급 300만 원이면 저축 얼마나 해?",
    content: "생활비 빼고 다들 얼마나 저축하는지 궁금해.",
    views: 620,
    likes: 38,
    comments: [],
    createdAt: "08:50",
  },
  {
    id: 5,
    category: "진로&성공",
    title: "퇴사하고 새로운 일 시작한 사람 있어?",
    content: "새로운 도전을 준비 중인데 경험담이 궁금해.",
    views: 530,
    likes: 27,
    comments: [],
    createdAt: "08:20",
  },
  {
    id: 6,
    category: "취향&라이프스타일",
    title: "요즘 가장 만족하는 취미 하나씩 말해줘",
    content: "다들 어떤 취미를 즐기고 있어?",
    views: 410,
    likes: 19,
    comments: [],
    createdAt: "07:30",
  },
];

export default function Home() {
  const [posts, setPosts] = useState<Post[]>(samplePosts);
  useEffect(() => {
  async function loadPosts() {
    
const { data: likeData, error: likeError } = await supabase
  .from("post_likes")
  .select("post_id");

if (likeError) {
  console.error("추천 불러오기 실패:", likeError.message);
}

const likeCounts = new Map<number, number>();

for (const like of likeData ?? []) {
  likeCounts.set(
    like.post_id,
    (likeCounts.get(like.post_id) ?? 0) + 1
  );
}

    const { data, error } = await supabase
      .from("posts")
      
.select("id, category, title, preview_title, content, views, likes, created_at")

      .order("created_at", { ascending: false });

    if (error) {
      console.error("게시글 불러오기 실패:", error.message);
      return;
    }

    const savedPosts: Post[] = (data ?? []).map((post) => ({
      id: post.id,
      category: post.category,
      title: post.title,
      
previewTitle: post.preview_title ?? "",

      content: post.content,
      views: post.views,
      likes: likeCounts.get(post.id) ?? 0,
      comments: [],
      createdAt: new Date(post.created_at).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    setPosts(savedPosts);
  }

  loadPosts();
}, []);
  const [active, setActive] = useState("전체글");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [writing, setWriting] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  
const [newPreviewTitle, setNewPreviewTitle] = useState("");

  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("연애&사랑");
  const [newComment, setNewComment] = useState("");

  const bestPosts = [...posts]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 5);

  const visiblePosts = posts
    .filter((post) => {
      if (active === "전체글") return true;
      if (active === "BEST 글") {
        return bestPosts.some((best) => best.id === post.id);
      }
      return post.category === active;
    })
    .filter((post) =>
      (post.title + " " + post.content)
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  const selectedPost = posts.find((p) => p.id === selectedId);

  

async function openPost(id: number) {
  setSelectedId(id);
  setWriting(false);
  setNewComment("");
  
  const { error: viewError } = await supabase.rpc(
    "increment_post_views",
    { post_id_input: id }
  );

  if (viewError) {
    console.error("조회수 저장 실패:", viewError.message);
  }
  
const { data: updatedPost, error: fetchError } = await supabase
  .from("posts")
  .select("views")
  .eq("id", id)
  .single();

if (fetchError) {
  console.error("조회수 불러오기 실패:", fetchError.message);
}



  const { data, error } = await supabase
    .from("comments")
    .select("content")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("댓글 불러오기 실패:", error.message);
    alert("댓글을 불러오지 못했어!");
    return;
  }

  setPosts((prev) =>
    prev.map((p) =>
      p.id === id
        ? {
            ...p,
            views: updatedPost?.views ?? p.views,
            comments: (data ?? []).map((comment) => comment.content),
          }
        : p
    )
  );
}



  async function createPost() {
    if (!newTitle.trim() || !newContent.trim()) {
      alert("제목과 내용을 입력해줘!");
      return;
    }

    const post: Post = {
      id: Date.now(),
      category: newCategory,
      title: newTitle.trim(),
      
previewTitle: newPreviewTitle.trim(),

      content: newContent.trim(),
      views: 0,
      likes: 0,
      comments: [],
      createdAt: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    
        const { data: authData, error: authError } =
      await supabase.auth.signInAnonymously();

    if (authError || !authData.user) {
      alert("익명 인증에 실패했어: " + (authError?.message ?? ""));
      return;
    }

    const { data, error } = await supabase
      .from("posts")
      .insert({
        category: post.category,
        title: post.title,
          preview_title: newPreviewTitle.trim() || null,
        content: post.content,
        author_id: authData.user.id,
      })
      .select("id")
      .single();

    if (error || !data) {
      alert("게시글 저장 실패: " + (error?.message ?? ""));
      return;
    }

    post.id = data.id;
    
setPosts((prev) => [post, ...prev]);

    setNewTitle("");
    setNewPreviewTitle("");
    setNewContent("");
    setWriting(false);
    setActive("전체글");
    setSelectedId(post.id);
  }

  
async function likePost(id: number) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    alert("익명 인증을 확인하지 못했어. 새로고침 후 다시 시도해 줘!");
    return;
  }

  const { error } = await supabase
    .from("post_likes")
    .insert({
      post_id: id,
      user_id: user.id,
    });

  if (error) {
    if (error.code === "23505") {
      alert("이미 추천한 게시글이야! 💗");
    } else {
      alert("추천 저장 실패: " + error.message);
    }
    return;
  }

  setPosts((prev) =>
    prev.map((p) =>
      p.id === id ? { ...p, likes: p.likes + 1 } : p
    )
  );
}


  
async function addComment(id: number) {
  const content = newComment.trim();

  if (!content) return;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    alert("익명 인증을 확인하지 못했어. 새로고침 후 다시 시도해 줘!");
    return;
  }

  const { error } = await supabase
    .from("comments")
    .insert({
      post_id: id,
      author_id: user.id,
      content,
    });

  if (error) {
    alert("댓글 저장 실패: " + error.message);
    return;
  }

  setPosts((prev) =>
    prev.map((p) =>
      p.id === id
        ? { ...p, comments: [...p.comments, content] }
        : p
    )
  );

  setNewComment("");
}



    
async function deletePost(id: number) {
  if (!confirm("정말 이 게시글을 삭제할까?")) return;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    alert("작성자 인증을 확인하지 못했어!");
    return;
  }

  const { data, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id)
    .select("id");

  if (error) {
    alert("삭제 실패: " + error.message);
    return;
  }

  if (!data || data.length === 0) {
    alert("본인이 작성한 게시글만 삭제할 수 있어!");
    return;
  }

  setPosts((prev) => prev.filter((p) => p.id !== id));
  setSelectedId(null);
  setWriting(false);

  alert("게시글이 삭제됐어!");
}
function goHome(category = "전체글") {

    setActive(category);
    setSelectedId(null);
    setWriting(false);
  }

  return (
    <main className="min-h-screen bg-white text-[#222]">
      <div className="mx-auto max-w-[1100px] px-4">

        <div className="flex justify-between border-b border-gray-100 py-3 text-xs text-gray-500">
          <span>시침풍 메인가기</span>
          <span>익명 커뮤니티 · 테스트 버전</span>
        </div>

        <header className="flex flex-wrap items-center justify-between gap-5 py-8">
          <div
            className="cursor-pointer"
            onClick={() => goHome()}
          >
            <h1 className="text-4xl font-black tracking-tight">
              <span className="text-red-500">시침풍</span> 시대침투판
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              세상의 모든 이야기가 모이는 곳
            </p>
          </div>

          <div className="flex items-center border border-gray-300 px-3 py-2">
            <input
              className="w-48 outline-none"
              placeholder="게시글 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="ml-2">⌕</span>
          </div>
        </header>

        <nav className="flex flex-wrap gap-x-6 gap-y-3 border-y border-gray-200 py-5">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => goHome(category)}
              className={`cursor-pointer text-sm font-semibold ${
                active === category
                  ? "text-red-500"
                  : "text-gray-700 hover:text-red-500"
              }`}
            >
              {category === "BEST 글" ? "🔥 BEST 글" : category}
            </button>
          ))}
        </nav>

        {!writing && selectedId === null && (
          <>
            <section className="mt-8 border border-gray-200 p-5">
              <div className="mb-5 flex items-center justify-between border-b-2 border-black pb-3">
                <h2 className="text-xl font-bold">🔥 오늘의 BEST 글</h2>
                <button
                  className="text-xs text-gray-500"
                  onClick={() => goHome("BEST 글")}
                >
                  더보기 +
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {bestPosts.map((post, index) => (
                  <button
                    key={post.id}
                    onClick={() => openPost(post.id)}
                    className="flex cursor-pointer gap-3 border-b border-gray-100 py-3 text-left"
                  >
                    <span className="font-bold text-red-500">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
  {post.previewTitle || post.title}
</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {post.category} · 추천 {post.likes}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-10">
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <h2 className="text-xl font-bold">
                  {active === "전체글" ? "전체 게시글" : active}
                </h2>
                <button
                  onClick={() => setWriting(true)}
                  className="cursor-pointer bg-red-500 px-5 py-2 text-sm font-bold text-white"
                >
                  글쓰기 +
                </button>
              </div>

              <div className="grid grid-cols-[1fr_65px_65px] border-b bg-gray-50 py-3 text-center text-xs text-gray-500 sm:grid-cols-[100px_1fr_75px_75px]">
                <span className="hidden sm:block">카테고리</span>
                <span>제목</span>
                <span>조회</span>
                <span>추천</span>
              </div>

              {visiblePosts.map((post) => (
                <div
                  key={post.id}
                  className="grid grid-cols-[1fr_65px_65px] items-center border-b border-gray-200 py-4 text-sm sm:grid-cols-[100px_1fr_75px_75px]"
                >
                  <span className="hidden text-xs text-gray-400 sm:block">
                    {post.category}
                  </span>

                  <button
                    onClick={() => openPost(post.id)}
                    className="min-w-0 cursor-pointer truncate text-left hover:underline"
                  >
                    
{post.previewTitle || post.title}

                    <span className="ml-2 text-xs text-red-500">
                      [{post.comments.length}]
                    </span>
                  </button>

                  <span className="text-center text-xs text-gray-400">
                    {post.views}
                  </span>
                  <span className="text-center text-xs text-gray-400">
                    {post.likes}
                  </span>
                </div>
              ))}

              {visiblePosts.length === 0 && (
                <p className="py-12 text-center text-sm text-gray-400">
                  게시글이 없습니다.
                </p>
              )}
            </section>
          </>
        )}

        {writing && (
          <section className="mx-auto mt-10 max-w-3xl">
            <h2 className="border-b-2 border-black pb-4 text-2xl font-bold">
              글쓰기
            </h2>

            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="mt-6 w-full border border-gray-300 p-3"
            >
              {categories.slice(2).map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>

            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="mt-3 w-full border border-gray-300 p-3 outline-none"
            />

<input
  value={newPreviewTitle}
  onChange={(e) => setNewPreviewTitle(e.target.value)}
  placeholder="목록용 제목 (선택) · 예: 엄마가 내 결혼식에..."
  className="mt-3 w-full border border-gray-300 p-3 outline-none"
/>

            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="사연을 자유롭게 작성해 주세요."
              className="mt-3 h-72 w-full resize-y border border-gray-300 p-3 outline-none"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setWriting(false)}
                className="border border-gray-300 px-6 py-3"
              >
                취소
              </button>
              <button
                onClick={createPost}
                className="bg-red-500 px-6 py-3 font-bold text-white"
              >
                등록하기
              </button>
            </div>
          </section>
        )}

        {selectedPost && !writing && (
          <article className="mx-auto mt-10 max-w-3xl">
            <button
              onClick={() => goHome(active)}
              className="mb-6 text-sm text-gray-500"
            >
              ← 목록으로
            </button>
            
<button
  onClick={() => deletePost(selectedPost.id)}
  className="ml-4 text-sm text-gray-400 hover:text-red-500"
>
  삭제하기
</button>


            <div className="border-b-2 border-black pb-5">
              <p className="mb-3 text-sm text-red-500">
                {selectedPost.category}
              </p>
              <h2 className="text-2xl font-bold">
                {selectedPost.title}
              </h2>
              <p className="mt-4 text-xs text-gray-400">
                익명 · {selectedPost.createdAt} · 조회 {selectedPost.views}
              </p>
            </div>

            <div className="min-h-64 whitespace-pre-wrap py-10 text-base leading-8">
              {selectedPost.content}
            </div>

            <div className="flex justify-center border-b pb-10">
              <button
                onClick={() => likePost(selectedPost.id)}
                className="rounded border border-red-300 px-8 py-3 font-bold text-red-500"
              >
                ♡ 추천 {selectedPost.likes}
              </button>
            </div>

            <section className="mt-8">
              <h3 className="mb-5 text-lg font-bold">
                댓글 {selectedPost.comments.length}
              </h3>

              {selectedPost.comments.map((comment, index) => (
                <div
                  key={index}
                  className="border-b border-gray-100 py-4"
                >
                  <p className="mb-2 text-xs font-bold text-gray-500">
                    익명 {index + 1}
                  </p>
                  <p className="text-sm">{comment}</p>
                </div>
              ))}

              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요"
                className="mt-6 h-24 w-full border border-gray-300 p-3"
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => addComment(selectedPost.id)}
                  className="bg-gray-800 px-5 py-2 text-sm text-white"
                >
                  댓글 등록
                </button>
              </div>
            </section>
          </article>
        )}

        <footer className="mt-24 border-t py-8 text-center text-xs text-gray-400">
          시침풍 © 2026 · 익명 커뮤니티 테스트 버전
        </footer>
      </div>
    </main>
  );
}
