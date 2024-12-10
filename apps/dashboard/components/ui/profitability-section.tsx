import { DollarIcon } from "./dolar-icon";

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
          <h3 className="text-foreground text-sm text-left mb-2">Cost/Drain</h3>
          <div>
            <p className="text-2xl font-semibold text-white mb-1">
              <div className="flex space-x-2">
                <div className="bg-gray-200 h-8 w-6 rounded-md"></div>
              </div>
            </p>
          </div>
        </div>
        <div className="flex flex-col w-1/2">
          <h3 className="text-foreground text-sm text-left w-fit mb-2">
            Available Treasury
          </h3>
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
