const polygonConfig = function (points) {
  return {
    fill: "rgba(0,0,360,.5)",
    strokeWidth: 1,
    stroke: "black",
    objectCaching: false,
    transparentCorners: false,
    cornerSize: 10,
    cornerStyle: "circle",
    perPixelTargetFind: true,
    hasBorders: false,
    controls: points.reduce(function (acc, point, index) {
      var lastControl = points.length - 1;
      acc["p" + index] = new fabric.Control({
        positionHandler: polygonPositionHandler,
        actionHandler: anchorWrapper(
          index > 0 ? index - 1 : lastControl,
          actionHandler
        ),
        actionName: "modifyPolygon",
        pointIndex: index,
      });
      return acc;
    }, {}),
  };
};

export { polygonConfig };
