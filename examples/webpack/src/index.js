import "@johnmorrisdotca/address-plus/element/define";

const field = document.createElement("address-field");
field.setAttribute("country", "US");
field.setAttribute("label", "Shipping address");
field.setAttribute("value", "1600 Pennsylvania Ave NW, Washington, DC 20500");
field.setAttribute("validate", "");
document.body.append(field);
