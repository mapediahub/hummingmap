import { Component } from '@angular/core';
import { DomSanitizer, platformBrowser } from '@angular/platform-browser'
import { WebserviceService } from '../service/webservice.service';
import * as L from 'leaflet';
import 'leaflet-imageoverlay-rotated';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {


  public map: any;
  center_latlng: any = [14.26625690599938, 100.06070528823888];
  zoom: any = 6;
  layerMap: any;

  list_province: any = [];
  list_amphoe: any = [];
  list_tambon: any = [];
  province: any = "";
  amphoe: any = "";
  tambon: any = "";

  layer_group: any;

  station_list: any = [];
  station: any = {
    areaTH: "",
    nameTH: "",
    lat: "",
    long: "",
  };

  st_icon = L.icon({
    iconUrl: 'assets/images/hospital.png',
    iconSize: [20, 27],
    iconAnchor: [0, 0],
  })

  station_layer: any;

  st_check: any = true;



  img_icon = L.icon({
    iconUrl: 'https://mapedia.co.th/prod/api/image/picture.png',
    iconSize: [30, 30],
    iconAnchor: [15, 15],

  })

  all_image: any = [];
  raw_image: any = [];

  count: any = 0;
  fileAmount: any = 0;

  layer_gcp: any = L.layerGroup();
  layer_image: any = L.layerGroup();

  layer_footprint: any = L.layerGroup();
  layer_footprint_hover: any = L.layerGroup();

  render_image: any = L.layerGroup();

  constructor(
    private webservice: WebserviceService,
    public domSanitizer: DomSanitizer,
  ) { }

  async ngOnInit(): Promise<void> {
    this.initmap();
  }

  async initmap() {
    this.map = L.map("map").setView(this.center_latlng, this.zoom);


    var layerMap = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      attribution: '&copy; <a href="https://www.google.com/maps">Google</a>',
      maxZoom: 25,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(this.map);

    var CartoDB = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxNativeZoom: 24,
      maxZoom: 25
    });

    var baseMap = {
      "Google Map": layerMap, // BaseMaps
      "CartoDB": CartoDB, 		// BaseMaps
    };


    var options = {
      "image": this.layer_image, 		// BaseMaps
      "image_footprint": this.layer_footprint, //footprint
      "render_image": this.render_image, //footprint
    };

    var checkbox = L.control.layers(baseMap, options).addTo(this.map);
    setTimeout(() => {
      this.map.invalidateSize();
    }, 300);
  }

  imagesSelected(event: any) {

    const files: File[] = event.target.files;

    if (typeof files === 'undefined') {
      return;
    }
    return this.handleImages(files);


  }

  async handleImages(files: File[]) {


    if (files.length == 0) return;

    var newImages = [];
    this.count = 0;
    this.fileAmount = files.length;
    for (let i = 0; i < files.length; i++) {

      let file = files[i];

      const name = file.name;
      const type = file.type;

      const url = (window.URL ? URL : webkitURL).createObjectURL(file);
      const imageUrl = url !== null ? this.domSanitizer.bypassSecurityTrustResourceUrl(url) : null;

      //   // Save image
      const image = await this.webservice.saveImageRaw(file, url);
      this.count++;
    }
    // if (this.arrayGCP.length > 0 && this.count == files.length) {

    //   this.webservice.matchImage();
    // }
    this.all_image = this.webservice.images;
    this.raw_image = this.webservice.task_images;
    // console.log(this.raw_image);
    setTimeout(() => {
      this.setMarkerImage();
    }, 2000)
  }

  async setMarkerImage() {
    if (this.layer_image != undefined && this.layer_image != null) {
      this.layer_image.clearLayers();
    }
    if (this.layer_footprint != undefined && this.layer_footprint != null) {
      this.layer_footprint.clearLayers();
    }
    await this.setBBox();
  }

  async setBBox() {

    for (var i in this.all_image) {

      var poly: any = L.geoJSON(this.all_image[i].geom, {
        style: {
          color: 'green',
          fillColor: 'yellow',
          fillOpacity: 0
        }
      }).addTo(this.layer_footprint);
      this.layer_image.addTo(this.map);
      var bounds = poly.getBounds();
      // console.log(this.all_image[i].geom.geometry.coordinates[0]);
      // console.log(e.yaw);
      this.map.fitBounds(bounds)
      if (this.all_image[i].yaw <= 90) {
        var point1 = L.latLng(this.all_image[i].geom.geometry.coordinates[0][3][1], this.all_image[i].geom.geometry.coordinates[0][3][0]);
        var point2 = L.latLng(this.all_image[i].geom.geometry.coordinates[0][2][1], this.all_image[i].geom.geometry.coordinates[0][2][0]);
        var point3 = L.latLng(this.all_image[i].geom.geometry.coordinates[0][0][1], this.all_image[i].geom.geometry.coordinates[0][0][0]);
        //หมุน 90-179 องศา
      } else if (this.all_image[i].yaw > 90 && this.all_image[i].yaw < 179) {
        var point1 = L.latLng(this.all_image[i].geom.geometry.coordinates[0][1][1], this.all_image[i].geom.geometry.coordinates[0][1][0]);
        var point2 = L.latLng(this.all_image[i].geom.geometry.coordinates[0][0][1], this.all_image[i].geom.geometry.coordinates[0][0][0]);
        var point3 = L.latLng(this.all_image[i].geom.geometry.coordinates[0][2][1], this.all_image[i].geom.geometry.coordinates[0][2][0]);
      } else {
        var point1 = L.latLng(this.all_image[i].geom.geometry.coordinates[0][3][1], this.all_image[i].geom.geometry.coordinates[0][3][0]);
        var point2 = L.latLng(this.all_image[i].geom.geometry.coordinates[0][2][1], this.all_image[i].geom.geometry.coordinates[0][2][0]);
        var point3 = L.latLng(this.all_image[i].geom.geometry.coordinates[0][0][1], this.all_image[i].geom.geometry.coordinates[0][0][0]);
      }
      // setTimeout(()=>{
      var overlay: any = L.imageOverlay.rotated(this.all_image[i].url, point1, point2, point3).addTo(this.map);
      // },1000)


      let content = `<h6 style="color:black">Image: ${this.all_image[i].name} </h6>`;
      L.marker([this.all_image[i].lat, this.all_image[i].lng], { icon: this.img_icon })
        .bindPopup(content)
        .on('mouseover', (ev: any) => {
          L.geoJSON(this.all_image[i].geom, {
            style: {
              color: 'yellow',
              fillColor: 'yellow',
              fillOpacity: 0.2
            }
          }).addTo(this.layer_footprint_hover);
          this.layer_footprint_hover.addTo(this.map)
        })
        .on('mouseout', (ev: any) => {
          // if (layer_marker != undefined && layer_marker != null) {
          //   layer_marker.clearLayers();
          // }
          if (this.layer_footprint_hover != undefined && this.layer_footprint_hover != null) {
            this.layer_footprint_hover.clearLayers();
          }
        })
        .addTo(this.layer_image);
      this.layer_image.addTo(this.map);

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }


    // await this.all_image.forEach(async (e: any) => {
    //   console.log(e);

    //   var poly: any = L.geoJSON(e.geom, {
    //     style: {
    //       color: 'green',
    //       fillColor: 'yellow',
    //       fillOpacity: 0
    //     }
    //   }).addTo(this.layer_footprint);
    //   this.layer_image.addTo(this.map);
    //   var bounds = poly.getBounds();
    //   // console.log(e.geom.geometry.coordinates[0]);
    //   // console.log(e.yaw);
    //   this.map.fitBounds(bounds)
    //     if(e.yaw<=90){ 
    //       var point1 = L.latLng(e.geom.geometry.coordinates[0][3][1],e.geom.geometry.coordinates[0][3][0]);
    //       var point2 = L.latLng(e.geom.geometry.coordinates[0][2][1],e.geom.geometry.coordinates[0][2][0]);
    //       var point3 = L.latLng(e.geom.geometry.coordinates[0][0][1],e.geom.geometry.coordinates[0][0][0]);
    //     //หมุน 90-179 องศา
    //     }else if(e.yaw>90&&e.yaw<179){
    //       var point1 = L.latLng(e.geom.geometry.coordinates[0][1][1],e.geom.geometry.coordinates[0][1][0]);
    //       var point2 = L.latLng(e.geom.geometry.coordinates[0][0][1],e.geom.geometry.coordinates[0][0][0]);
    //       var point3 = L.latLng(e.geom.geometry.coordinates[0][2][1],e.geom.geometry.coordinates[0][2][0]);
    //     }else {
    //       var point1 = L.latLng(e.geom.geometry.coordinates[0][3][1],e.geom.geometry.coordinates[0][3][0]);
    //       var point2 = L.latLng(e.geom.geometry.coordinates[0][2][1],e.geom.geometry.coordinates[0][2][0]);
    //       var point3 = L.latLng(e.geom.geometry.coordinates[0][0][1],e.geom.geometry.coordinates[0][0][0]);
    //     }
    //     setTimeout(()=>{
    //      var overlay: any = L.imageOverlay.rotated(e.url, point1, point2, point3).addTo(this.render_image);
    //     },5000)


    //   let content = `<h6 style="color:black">Image: ${e.name} </h6>`;
    //   L.marker([e.lat, e.lng], { icon: this.img_icon })
    //     .bindPopup(content)
    //     .on('mouseover', (ev) => {
    //       L.geoJSON(e.geom, {
    //         style: {
    //           color: 'yellow',
    //           fillColor: 'yellow',
    //           fillOpacity: 0.2
    //         }
    //       }).addTo(this.layer_footprint_hover);
    //       this.layer_footprint_hover.addTo(this.map)
    //     })
    //     .on('mouseout', (ev) => {
    //       // if (layer_marker != undefined && layer_marker != null) {
    //       //   layer_marker.clearLayers();
    //       // }
    //       if (this.layer_footprint_hover != undefined && this.layer_footprint_hover != null) {
    //         this.layer_footprint_hover.clearLayers();
    //       }
    //     })
    //     .addTo(this.layer_image);
    //   this.layer_image.addTo(this.map);
    // });


  }

}
