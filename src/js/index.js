import "../scss/common.scss";
import { fabric } from "fabric";
import { drawer } from "./drawer";

const file = document.getElementById("file");
const img = document.getElementById("img");
file.addEventListener("change", function () {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const uploaded_image = reader.result;
    img.src = uploaded_image;
    img.addEventListener("load", () => {
      console.log({ width: img.clientWidth, height: img.clientHeight });
      const draw = drawer({ width: img.clientWidth, height: img.clientHeight });
      setTimeout(() => {
        draw.getData();
      }, 2000);
    });
  });
  reader.readAsDataURL(this.files[0]);
});

// const draw = drawer({ width: 1000, height: 600 });
// setTimeout(() => {
//   draw.getData();
// }, 2000);
