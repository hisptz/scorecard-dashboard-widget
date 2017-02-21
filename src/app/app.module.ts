import {BrowserModule, SafeHtml} from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';

import { DataService } from "./shared/data.service";
import { Constants } from './shared/costants';
import {ScorecardService} from "./shared/services/scorecard.service";
import {FilterService} from "./shared/services/filter.service";
import {OrgUnitService} from "./shared/services/org-unit.service";
import { TreeModule } from 'angular2-tree-component';
import {CardWidgetService} from "./shared/services/card-widget.service";
import {ViewComponent} from "./view/view.component";
import { SvgItemComponent } from './view/svg-item/svg-item.component';
import { SubtotalComponent } from './view/subtotal/subtotal.component';
import { FilterByNamePipe } from './shared/filter-by-name.pipe';
import {MetadataDictionaryComponent} from "./view/metadatadictionary/metadata-dictionary.component";
import {ScorecardComponent} from "./view/scorecard/scorecard.component";
import {SafeHtmlPipe} from "./shared/safe-html.pipe";

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ViewComponent,
    SvgItemComponent,
    SubtotalComponent,
    FilterByNamePipe,
    MetadataDictionaryComponent,
    SubtotalComponent,
    SvgItemComponent,
    ScorecardComponent,
    SafeHtmlPipe
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    TreeModule,
  ],
  providers: [
    DataService,
    Constants,
    ScorecardService,
    FilterService,
    OrgUnitService,
    CardWidgetService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
