
import React from 'react';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center bg-slate-50">
      <img
      src="/404_Not_Found.png"
      alt="404 Not Found"
      className="max-w-full mb-6 w-96"
      />

      <p className="text-xl font-semibold text-gray-800 mb-4">
        Bạn đang đi lạc vào vùng đất chưa được khám phá!
      </p>
      <p className="text-gray-600 mb-8">
        Trang bạn đang tìm kiếm không tồn tại. Hãy quay lại trang chủ và tiếp tục cuộc hành trình của bạn.
      </p>
      <a
        href="/"
        className="inline-block px-6 py-3 bg-blue-600 text-white shadow-md hover:bg-blue-700 transition rounded-2xl "
      >
        Quay về trang chủ
      </a>
    </div>
  );
}
export default NotFound;
