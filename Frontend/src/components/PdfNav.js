import { useMediaQuery } from "@/utils/mediaQueryHook";
import { LeftCircleTwoTone, RightCircleTwoTone } from "@ant-design/icons";

export default function Nav({
  pageNumber,
  numPages,
  title = "The Smart Test Prep",
  goToPreviousPage,
  goToNextPage,
}) {
  const isMobile = useMediaQuery({
    query: "(max-width: 768px)",
  });
  return (
    <nav className="bg-black">
      <div className="mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex flex-1 items-center lg:justify-center sm:items-stretch sm:justify-start">
            <div className="flex flex-shrink-0 items-center">
              <p className="lg:text-2xl sm:text-base font-bold tracking-tighter text-white">
                {title}
              </p>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {/* <Button shape="circle" disabled={pageNumber <= 1} ><LeftCircleTwoTone onClick={goToPreviousPage} style={{fontSize: '24px'}} aria-hidden="true" /></Button> */}
            <LeftCircleTwoTone
              className="cursor-not-allowed"
              onClick={goToPreviousPage}
              style={{ fontSize: "24px" }}
              aria-hidden="true"
            />
            <div className="text-white rounded-md px-3 py-2 text-sm font-medium">
              <span>{pageNumber}</span>
              <span className="text-gray-400"> / {numPages}</span>
            </div>
            {/* <Button shape="circle" disabled={pageNumber >= numPages}><RightCircleTwoTone onClick={goToNextPage} style={{fontSize: '24px'}} aria-hidden="true" /></Button> */}
            <RightCircleTwoTone
              className="cursor-not-allowed"
              onClick={goToNextPage}
              style={{ fontSize: "24px" }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
