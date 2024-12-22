import React, { Suspense } from 'react';
import Header from 'components/Header';
import LoadingSpinner from 'components/Loading';

// 컴포넌트 동적 로드
const Body = React.lazy(() => import('components/Body_SignInUp'));

const SignInUP = () => {
  return (
    <div className="w-full h-screen flex flex-col mx-auto bg-[#181818]">
      <Header />

      <div className="flex-grow mt-[4rem]">
        {/* 로딩 화면 */}
        <Suspense
          fallback={
            <div className="flex-grow h-[100%] justify-center items-center bg-[#181818]">
              <LoadingSpinner />
            </div>
          }
        >
          <Body />
        </Suspense>
      </div>
    </div>
  );
};

export default SignInUP;
