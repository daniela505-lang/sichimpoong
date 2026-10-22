
import { supabase } from "@/lib/supabase";

export default async function TestDB() {
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, category");

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold">
        시침풍 데이터베이스 연결 테스트
      </h1>

      {error ? (
        <p className="mt-5 text-red-500">
          연결 오류: {error.message}
        </p>
      ) : (
        <p className="mt-5 text-green-600">
          연결 성공! 게시글 {data?.length ?? 0}개
        </p>
      )}
    </main>
  );
}
