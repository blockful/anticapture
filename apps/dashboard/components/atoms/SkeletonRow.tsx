export const SkeletonRow = ({ width = "w-32", height = "h-5" }) => {
  return (
    <div className={`flex animate-pulse justify-center space-x-2`}>
      <div className={`${width} ${height} rounded bg-gray-300`} />
    </div>
  );
};
