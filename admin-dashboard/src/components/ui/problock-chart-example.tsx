import React from 'react';

// 프로블록에서 제공된 차트 예제 코드
const ProblockChartExample: React.FC = () => {
  return (
    <div className="w-72 h-[654.67px] relative rounded-[5px] border border-purple-500 overflow-hidden">
      <div className="size-52 left-[20px] top-[20px] absolute inline-flex flex-col justify-start items-center gap-9">
        <div data-stroke="Yes" className="size-52 relative">
          <div className="size-52 left-0 top-0 absolute bg-base-chart-1 rounded-full outline outline-1 outline-offset-[-0.50px] outline-tailwind-colors-base-white" />
          <div className="size-52 left-0 top-0 absolute bg-base-chart-5 rounded-full outline outline-1 outline-offset-[-0.50px] outline-tailwind-colors-base-white" />
          <div className="size-52 left-0 top-0 absolute bg-base-chart-4 rounded-full outline outline-1 outline-offset-[-0.50px] outline-tailwind-colors-base-white" />
          <div className="size-52 left-0 top-0 absolute bg-base-chart-3 rounded-full outline outline-1 outline-offset-[-0.50px] outline-tailwind-colors-base-white" />
          <div className="size-52 left-0 top-0 absolute bg-base-chart-2 rounded-full outline outline-1 outline-offset-[-0.50px] outline-tailwind-colors-base-white" />
        </div>
        <div className="w-32 h-28 relative">
          <div className="left-[72.24px] top-0 absolute text-center justify-start text-tailwind-colors-base-white text-xs font-normal font-['Pretendard'] leading-none">Chrome</div>
          <div className="left-[3.11px] top-[12.99px] absolute text-center justify-start text-tailwind-colors-base-white text-xs font-normal font-['Pretendard'] leading-none">Safari</div>
          <div className="left-[3.87px] top-[77.93px] absolute text-center justify-start text-tailwind-colors-base-white text-xs font-normal font-['Pretendard'] leading-none">Firefox</div>
          <div className="left-[66.69px] top-[92.42px] absolute text-center justify-start text-tailwind-colors-base-white text-xs font-normal font-['Pretendard'] leading-none">Edge</div>
          <div className="left-[98.01px] top-[58.84px] absolute text-center justify-start text-tailwind-colors-base-white text-xs font-normal font-['Pretendard'] leading-none">Other</div>
        </div>
        <div data-item-2="true" data-item-3="true" data-item-4="true" data-item-5="true" className="w-52 h-12 left-0 top-[249px] absolute inline-flex justify-center items-center gap-4 flex-wrap content-center">
          <div data-type="Default" className="size- flex justify-start items-center gap-1.5">
            <div className="size-2 bg-base-chart-1 rounded-xs" />
            <div className="justify-start text-base-foreground text-xs font-normal font-['Pretendard'] leading-none">Item 1</div>
          </div>
          <div data-type="Default" className="size- flex justify-start items-center gap-1.5">
            <div className="size-2 bg-base-chart-2 rounded-xs" />
            <div className="justify-start text-base-foreground text-xs font-normal font-['Pretendard'] leading-none">Item 2</div>
          </div>
          <div data-type="Default" className="size- flex justify-start items-center gap-1.5">
            <div className="size-2 bg-base-chart-3 rounded-xs" />
            <div className="justify-start text-base-foreground text-xs font-normal font-['Pretendard'] leading-none">Item 3</div>
          </div>
          <div data-type="Default" className="size- flex justify-start items-center gap-1.5">
            <div className="size-2 bg-base-chart-4 rounded-xs" />
            <div className="justify-start text-base-foreground text-xs font-normal font-['Pretendard'] leading-none">Item 4</div>
          </div>
          <div data-type="Default" className="size- flex justify-start items-center gap-1.5">
            <div className="size-2 bg-base-chart-5 rounded-xs" />
            <div className="justify-start text-base-foreground text-xs font-normal font-['Pretendard'] leading-none">Item 5</div>
          </div>
        </div>
      </div>
      <div className="w-60 h-52 left-[20px] top-[337px] absolute inline-flex flex-col justify-start items-center gap-9">
        <div data-show-label-1="true" data-show-label-2="true" data-show-label-3="true" data-show-label-4="true" data-show-label-5="true" data-show-stroke="true" className="w-60 h-52 relative">
          <div className="w-3 h-4 left-[176.39px] top-[12px] absolute outline outline-1 outline-offset-[-0.50px] outline-base-chart-1" />
          <div className="left-[188.29px] top-0 absolute justify-start text-base-foreground text-xs font-normal font-['Pretendard'] leading-3">275</div>
          <div className="w-4 h-3 left-[23.03px] top-[40.31px] absolute outline outline-1 outline-offset-[-0.50px] outline-base-chart-2" />
          <div className="left-[1px] top-[28.31px] absolute text-right justify-start text-base-foreground text-xs font-normal font-['Pretendard'] leading-3">200</div>
          <div className="w-4 h-3.5 left-[31.93px] top-[168.56px] absolute outline outline-1 outline-offset-[-0.50px] outline-base-chart-3" />
          <div className="left-[11.91px] top-[169.75px] absolute text-right justify-start text-base-foreground text-xs font-normal font-['Pretendard'] leading-3">187</div>
          <div className="w-2 h-5 left-[154.16px] top-[194.70px] absolute outline outline-1 outline-offset-[-0.50px] outline-base-chart-4" />
          <div className="left-[161.44px] top-[201.33px] absolute justify-start text-base-foreground text-xs font-normal font-['Pretendard'] leading-3">173</div>
          <div className="w-5 h-1.5 left-[210.89px] top-[134.15px] absolute outline outline-1 outline-offset-[-0.50px] outline-base-chart-5" />
          <div className="left-[229.98px] top-[128.17px] absolute justify-start text-base-foreground text-xs font-normal font-['Pretendard'] leading-3">90</div>
        </div>
        <div data-stroke="Yes" className="size-48 relative">
          <div className="size-48 left-0 top-0 absolute bg-base-chart-1 rounded-full outline outline-1 outline-offset-[-0.50px] outline-tailwind-colors-base-white" />
          <div className="size-48 left-0 top-0 absolute bg-base-chart-5 rounded-full outline outline-1 outline-offset-[-0.50px] outline-tailwind-colors-base-white" />
          <div className="size-48 left-0 top-0 absolute bg-base-chart-4 rounded-full outline outline-1 outline-offset-[-0.50px] outline-tailwind-colors-base-white" />
          <div className="size-48 left-0 top-0 absolute bg-base-chart-3 rounded-full outline outline-1 outline-offset-[-0.50px] outline-tailwind-colors-base-white" />
          <div className="size-48 left-0 top-0 absolute bg-base-chart-2 rounded-full outline outline-1 outline-offset-[-0.50px] outline-tailwind-colors-base-white" />
        </div>
        <div className="w-28 h-24 relative">
          <div className="left-[63.38px] top-0 absolute text-center justify-start text-tailwind-colors-base-white text-xs font-normal font-['Pretendard'] leading-none">Chrome</div>
          <div className="left-[1px] top-[11.71px] absolute text-center justify-start text-tailwind-colors-base-white text-xs font-normal font-['Pretendard'] leading-none">Safari</div>
          <div className="left-[1.68px] top-[70.24px] absolute text-center justify-start text-tailwind-colors-base-white text-xs font-normal font-['Pretendard'] leading-none">Firefox</div>
          <div className="left-[59.28px] top-[83.31px] absolute text-center justify-start text-tailwind-colors-base-white text-xs font-normal font-['Pretendard'] leading-none">Edge</div>
          <div className="left-[86.64px] top-[53.04px] absolute text-center justify-start text-tailwind-colors-base-white text-xs font-normal font-['Pretendard'] leading-none">Other</div>
        </div>
        <div data-item-2="true" data-item-3="true" data-item-4="true" data-item-5="true" className="w-60 left-0 top-[249.33px] absolute inline-flex justify-center items-center gap-4 flex-wrap content-center">
          <div data-type="Default" className="size- flex justify-start items-center gap-1.5">
            <div className="size-2 bg-base-chart-1 rounded-xs" />
            <div className="justify-start text-base-foreground text-xs font-normal font-['Pretendard'] leading-none">Item 1</div>
          </div>
          <div data-type="Default" className="size- flex justify-start items-center gap-1.5">
            <div className="size-2 bg-base-chart-2 rounded-xs" />
            <div className="justify-start text-base-foreground text-xs font-normal font-['Pretendard'] leading-none">Item 2</div>
          </div>
          <div data-type="Default" className="size- flex justify-start items-center gap-1.5">
            <div className="size-2 bg-base-chart-3 rounded-xs" />
            <div className="justify-start text-base-foreground text-xs font-normal font-['Pretendard'] leading-none">Item 3</div>
          </div>
          <div data-type="Default" className="size- flex justify-start items-center gap-1.5">
            <div className="size-2 bg-base-chart-4 rounded-xs" />
            <div className="justify-start text-base-foreground text-xs font-normal font-['Pretendard'] leading-none">Item 4</div>
          </div>
          <div data-type="Default" className="size- flex justify-start items-center gap-1.5">
            <div className="size-2 bg-base-chart-5 rounded-xs" />
            <div className="justify-start text-base-foreground text-xs font-normal font-['Pretendard'] leading-none">Item 5</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblockChartExample;