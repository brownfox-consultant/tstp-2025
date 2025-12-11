import TestLoaderGif from "./../../../../../../../public/test-loading.gif";
import Image from "next/image";
function TestLoading() {
  return (
    <div className="w-full h-full">
      <div className="absolute top-1/2 left-1/2 text-center -translate-x-1/2 -translate-y-1/2">
        <Image src={TestLoaderGif} alt="loading..." height={150} width={150} />
        Loading test...
      </div>
    </div>
  );
}

export default TestLoading;
