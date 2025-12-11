'use client';

import { LeftCircleTwoTone, RightCircleTwoTone } from "@ant-design/icons";
import { Button } from "antd";
import { useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
// import { pdfjs } from 'react-pdf';


import { pdfjs } from "react-pdf";
import { useMediaQuery } from "react-responsive";
import Nav from "./PdfNav";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function PDFViewer(props) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1); // start on first page
  const [loading, setLoading] = useState(true);
  const [pageWidth, setPageWidth] = useState(0);
  const viewerRef = useRef();
  const lastScrollTop = useRef(0);
  const isMobile = useMediaQuery({
    query: "(max-width: 768px)",
  });
  // const [workerLoaded, setWorkerLoaded] = useState(false);
  
  // useEffect(() => {
  //   let isMounted = true;

  //   // Dynamically import the pdf worker config
  //   if (isMounted) {
  //     import('@/lib/pdfWorkerConfig.js').then(() => {
  //         setWorkerLoaded(true);
  //     });
  //   }

  //   // Cleanup function
  //   return () => {
  //     isMounted = false;
  //   };
  // }, []); 

  function onDocumentLoadSuccess({
    numPages: nextNumPages,
  }) {
    
    setNumPages(nextNumPages);
  }

  function onPageLoadSuccess() {
    setPageWidth(window.innerWidth);
    setLoading(false);
  }

  // Go to next page
  function goToNextPage() {
    if(pageNumber < numPages)
      setPageNumber((prevPageNumber) => prevPageNumber + 1);
  }

  function goToPreviousPage() {
    if(pageNumber > 1)
      setPageNumber((prevPageNumber) => prevPageNumber - 1);
  }

  
  return (
    <>
      <Nav pageNumber={pageNumber} numPages={numPages} title={props.title} goToNextPage={goToNextPage} goToPreviousPage={goToPreviousPage}/>
      <div
        ref={viewerRef}
        hidden={loading}
        style={{ height: "calc(100vh - 64px)", overflowY: 'scroll' }}
        className="flex items-center"
      >
        {/* <div
          className={`flex items-center justify-between w-full absolute z-10 px-2`}
        >
          <button
            onClick={goToPreviousPage}
            disabled={pageNumber <= 1}
            className="relative h-[calc(100vh - 64px)] px-2 py-24 text-gray-400 hover:text-gray-50 focus:z-20"
          >
            <span className="sr-only">Previous</span>
            <LeftCircleTwoTone style={{fontSize: '24px'}} className="h-20 w-20" aria-hidden="true" />
          </button>
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="relative h-[calc(100vh - 64px)] px-2 py-24 text-gray-400 hover:text-gray-50 focus:z-20"
          >
            <span className="sr-only">Next</span>
            <RightCircleTwoTone style={{fontSize: '24px'}} className="h-20 w-20" aria-hidden="true" />
          </button>
        </div> */}

        <div className="h-full flex justify-center mx-auto">
          <Document
            file={props.file}
            onLoadSuccess={onDocumentLoadSuccess}            
            renderMode="canvas"           
          >
            <Page
              className="pdf-page"
              key={pageNumber}
              pageNumber={pageNumber}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              onLoadSuccess={onPageLoadSuccess}
              onRenderError={() => setLoading(false)}
              width={Math.max(pageWidth * 0.5, 390)}
            />
          </Document>
        </div>
      </div>
    </>
  );
}
