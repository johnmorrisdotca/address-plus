import "@angular/compiler";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideZonelessChangeDetection } from "@angular/core";
import { ShippingAddressComponent } from "./shipping-address.component";

void bootstrapApplication(ShippingAddressComponent, { providers: [provideZonelessChangeDetection()] });
