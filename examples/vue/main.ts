import { createApp } from "vue";
import ShippingAddress from "./ShippingAddress.vue";

const app = createApp(ShippingAddress);
app.config.compilerOptions.isCustomElement = (tag) => tag === "address-field";
app.mount("#app");
