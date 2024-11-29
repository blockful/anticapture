import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { DollarIcon } from "./dolar-icon";
import { InfoIcon } from "./info-icon";

export const ProfitabilitySection = () => {
  return (
    <div className="flex flex-col text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left border border-lightDark rounded-lg p-3">
      <div className="flex space-x-3 items-center pb-4">
        <DollarIcon />
        <h1 className="text-lg text-white text-left font-medium">
          Profitability
        </h1>
      </div>
      <div className="p-4 bg-dark rounded-[4px] flex space-x-4 justify-between flex-grow">
        <div className="flex flex-col w-1/2">
          <div className="flex space-x-1.5 items-center mb-2">
            <h3 className="text-foreground text-sm text-left">Cost/Drain</h3>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon />
              </TooltipTrigger>
              <TooltipContent className="bg-dark border-foreground m-1">
                <p className="text-white">
                  Direct liquid profit: Cost of direct capture
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div>
            <p className="text-2xl font-semibold text-white mb-1">
              <div className="flex space-x-2">
                <div className="bg-gray-200 h-8 w-6 rounded-md"></div>
              </div>
            </p>
          </div>
        </div>
        <div className="flex flex-col w-1/2">
          <div className="flex space-x-1.5 items-center mb-2">
            <h3 className="text-foreground text-sm text-left  w-fit">
              Available Treasury
            </h3>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon />
              </TooltipTrigger>
              <TooltipContent className="bg-dark border-foreground m-1">
                <p className="text-white">
                  Non-native tokens that are liquid and under governance control
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div>
            <p className="text-2xl font-semibold text-white mb-1">
              <div className="flex space-x-2">
                <div className="bg-gray-200 h-8 w-6 rounded-md"></div>
              </div>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
