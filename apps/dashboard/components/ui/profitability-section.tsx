import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { DollarIcon, InfoIcon } from "@/shared/components/icons";

export const ProfitabilitySection = () => {
  return (
    <div className="flex flex-col rounded-lg border border-lightDark p-3 text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left">
      <div className="flex items-center space-x-3 pb-4">
        <DollarIcon />
        <h1 className="text-left text-lg font-medium text-white">
          Profitability
        </h1>
      </div>
      <div className="flex flex-grow justify-between space-x-4 rounded-[4px] bg-dark p-4">
        <div className="flex w-1/2 flex-col">
          <div className="mb-2 flex items-center space-x-1.5">
            <h3 className="text-left text-sm text-foreground">Cost/Drain</h3>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon />
              </TooltipTrigger>
              <TooltipContent className="m-1 border-foreground bg-dark">
                <p className="text-white">
                  Direct liquid profit: Cost of direct capture
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div>
            <p className="mb-1 text-2xl font-semibold text-white">
              {/* <div className="flex space-x-2">
                <div className="bg-gray-200 h-8 w-6 rounded-md"></div>
              </div> */}
            </p>
          </div>
        </div>
        <div className="flex w-1/2 flex-col">
          <div className="mb-2 flex items-center space-x-1.5">
            <h3 className="w-fit text-left text-sm text-foreground">
              Available Treasury
            </h3>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon />
              </TooltipTrigger>
              <TooltipContent className="m-1 border-foreground bg-dark">
                <p className="text-white">
                  Non-native tokens that are liquid and under governance control
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div>
            <p className="mb-1 text-2xl font-semibold text-white">
              <div className="flex space-x-2">
                <div className="h-8 w-6 rounded-md bg-gray-200"></div>
              </div>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
