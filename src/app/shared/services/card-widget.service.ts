import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {Http, Response} from "@angular/http";
import {Constants} from "../costants";
// Statics
import 'rxjs/add/observable/throw';

// Operators
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/toPromise';

export interface ScoreCardWidget {
  id : string;
  data: any;
}

@Injectable()
export class CardWidgetService {

  _scorecards: ScoreCardWidget[];
  private baseUrl: string;

  constructor(private http: Http, private costant: Constants) {
    this.baseUrl = this.costant.root_dir;
  }

  loadAll() {
    return this.http.get(this.baseUrl+"api/dataStore/scorecardswidget")
      .map((response: Response) => response.json())
      .catch(this.handleError);
  }

  load( id: string ) {
    return this.http.get(`${this.baseUrl}api/dataStore/scorecardswidget/${id}`)
      .map((response: Response) => response.json())
      .catch(this.handleError);
  }

  resize( id: string ) {
    return this.http.put(`${this.baseUrl}api/dashboardItems/${id}/shape/DOUBLE_WIDTH`,{})
      .map((response: Response) => response.json())
      .catch(this.handleError);
  }

  create( scorecard: ScoreCardWidget ) {
    return this.http.post(this.baseUrl+"api/dataStore/scorecardswidget/"+scorecard.id, scorecard.data)
      .map((response: Response) => response.json())
      .catch(this.handleError);
  }

  update( scorecard: ScoreCardWidget ) {
    return this.http.put(this.baseUrl+"api/dataStore/scorecardswidget/"+scorecard.id, scorecard.data)
      .map((response: Response) => response.json())
      .catch(this.handleError);
  }

  remove( scorecard: ScoreCardWidget ) {
    return this.http.delete(this.baseUrl+"api/dataStore/scorecardswidget/"+scorecard.id)
      .map((response: Response) => response.json())
      .catch(this.handleError);
  }

  private extractData( res: Response ) {
    let body = res.json();
    return body.data || { };
  }

  private handleError ( error: Response | any ) {
    // In a real world app, we might use a remote logging infrastructure
    let errMsg: string;
    if (error instanceof Response) {
      const body = error.json() || '';
      const err = body.error || JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    console.error(errMsg);
    return Observable.throw(errMsg);
  }

}



@Injectable()
export class ScorecardService {



}
