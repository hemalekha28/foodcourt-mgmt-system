export const getFlowRecommendation = ({
  currentProduct,
  allProducts
}) => {
  if (
    currentProduct.queueLabel !== 'Busy now'
  ) return null;

  const alternative = allProducts.find(p =>
    p.category === currentProduct.category &&
    p.queueLabel === 'Low queue' &&
    p.isPrepReady
  );

  if (!alternative) return null;

  return {
    message: 'Faster option available',
    alternative
  };
};
