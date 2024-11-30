export default function AddressInputs({
  addressProps,
  setAddressProp,
  disabled = false,
}) {
  const { phone, streetAddress, city, postalCode, province } = addressProps;
  return (
    <>
      <label>Phone Number</label>
      <input
        disabled={disabled}
        type="tel"
        placeholder="Phone Number"
        value={phone || ""}
        onChange={(e) => setAddressProp("phone", e.target.value)}
      />
      <label>Street address</label>
      <input
        disabled={disabled}
        type="text"
        placeholder="Street address"
        value={streetAddress || ""}
        onChange={(e) => setAddressProp("streetAddress", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label>City</label>
          <input
            disabled={disabled}
            type="text"
            placeholder="City"
            value={city || ""}
            onChange={(e) => setAddressProp("city", e.target.value)}
          />
        </div>
        <div>
          <label>Postal Code</label>
          <input
            disabled={disabled}
            type="text"
            placeholder="Postal Code"
            value={postalCode || ""}
            onChange={(e) => setAddressProp("postalCode", e.target.value)}
          />
        </div>
      </div>
      <label>Province</label>
      <input
        disabled={disabled}
        type="text"
        placeholder="Province"
        value={province || ""}
        onChange={(e) => setAddressProp("province", e.target.value)}
      />
    </>
  );
}
