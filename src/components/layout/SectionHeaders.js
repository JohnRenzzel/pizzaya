export default function SectionHeaders({ subHeader, mainHeader }) {
  return (
    <>
      <h3 className="uppercase text-center text-gray-500 font-semibold leading-4">
        {subHeader}
      </h3>
      <h2 className="text-center text-primary font-bold text-4xl italic">
        {mainHeader}
      </h2>
    </>
  );
}
