export class ProductPresentationDto {
    id: number;
    nombre: string | null;
    hexa: string | null;
    valor: number;
    valdescuento: number;
    descuento: boolean;
    porcentaje: number;
    imagen: string | null;
    orden: number | null;
  }
  
  export class ProductsDTO {
    id_origen: number | null;
    token: string | null;
    nombre: string;
    image: string | null;
    image1: string | null;
    image2: string | null;
    image3: string | null;
    peso: string;
    ancho: string | null;
    alto: string | null;
    grosor: string | null;
    descripcion: string | null;
    estado: string | null;

    fecha_creacion: Date | null;
  
    categories: {
      id: number;
      nombre: string;
    } | null;
  
    canal: {
      id: number;
      nombre: string;
    } | null;
  
    clasifica_collections: {
      id: string;
      nombre: string;
    } | null;
  
    presentations: ProductPresentationDto[];
  
    // Nuevos campos:
    valor: number;
    valordescuento: number;
    descuento: boolean;
    presentation_id: number | null;
    porcentaje: number;
  
    production_line: number | null;
    material: number | null;
  }
  