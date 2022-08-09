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
      console.log(img.clientWidth, img.clientHeight);
      drawer(img.clientWidth, img.clientHeight);
    });
  });
  reader.readAsDataURL(this.files[0]);
});
