import "@johnmorrisdotca/address-plus/element/define";

export function ShippingAddress({ country = "US" }: { country?: string }) {
  return <address-field country={country} label="Shipping address" value="1600 Pennsylvania Ave NW, Washington, DC 20500" validate />;
}
