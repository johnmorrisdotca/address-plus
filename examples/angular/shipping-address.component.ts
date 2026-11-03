import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from "@angular/core";
import "@johnmorrisdotca/address-plus/element/define";

@Component({
  selector: "app-shipping-address",
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<address-field [attr.country]="country" label="Shipping address" value="1600 Pennsylvania Ave NW, Washington, DC 20500" validate></address-field>`,
})
export class ShippingAddressComponent {
  @Input() country = "US";
}
