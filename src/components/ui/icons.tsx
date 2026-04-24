import type { SVGProps } from 'react';

export function ZappfyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 50 45" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M9.476 36.599s-2.672.057-4.005-.012C2.239 36.42.083 34.344.055 31.096c-.073-8.511-.073-17.025 0-25.536C.083 2.18 2.269.052 5.7.039 18.439-.012 31.18-.014 43.917.039c3.517.013 5.634 2.215 5.657 5.793.053 8.333.053 16.665-.006 24.998-.028 3.684-2.186 5.739-5.971 5.762-7.8.043-15.599.014-23.428.014-2.092 4.831-5.368 8.383-10.557 8.394-1.706.005-2.922-.417-2.922-.417s2.916-1.322 3.925-3.615c1.202-2.731.454-4.351.454-4.351l-1.594-.018Z"
        fill="url(#zappfy_grad)"
      />
      <path
        d="M27.828 11.226h-8.823a4.226 4.226 0 0 1-4.228-4.223h20.331v4.223L21.655 24.896h9.327a4.226 4.226 0 0 1 4.228 4.223H14.41v-4.223l13.419-13.67Z"
        fill="#171D18"
      />
      <defs>
        <linearGradient id="zappfy_grad" x1="-10.158" y1="43.912" x2="51.345" y2="-1.247" gradientUnits="userSpaceOnUse">
          <stop stopColor="#51C26F" />
          <stop offset="1" stopColor="#F2E901" />
        </linearGradient>
      </defs>
    </svg>
  );
}
