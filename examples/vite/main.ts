import "@johnmorrisdotca/address-plus/element/define";

const field = document.querySelector("address-field")!;
field.addEventListener("address-plus-change", (event) => console.log((event as CustomEvent<{ valid: boolean }>).detail.valid));
