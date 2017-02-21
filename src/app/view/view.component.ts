import {
  Component, OnInit, AfterViewInit, ViewChild, ValueProvider, style, state, animate, transition, trigger,
  OnDestroy, Input
} from '@angular/core';
import {Http} from "@angular/http";
import {ScoreCard, ScorecardService} from "../shared/services/scorecard.service";
import {Subscription} from "rxjs";
import {DataService} from "../shared/data.service";
import {FilterService} from "../shared/services/filter.service";
import {Constants} from "../shared/costants";
import {OrgUnitService} from "../shared/services/org-unit.service";
import {TreeNode, TREE_ACTIONS, IActionMapping, TreeComponent} from 'angular2-tree-component';
import {Angular2Csv} from "angular2-csv";
import {ScorecardComponent} from "./scorecard/scorecard.component";
import {CardWidgetService} from "../shared/services/card-widget.service";


const actionMapping1:IActionMapping = {
  mouse: {
    click: (node, tree, $event) => {
      $event.shiftKey
        ? TREE_ACTIONS.TOGGLE_SELECTED_MULTI(node, tree, $event)
        : TREE_ACTIONS.TOGGLE_SELECTED(node, tree, $event)
    }
  }
};

const actionMapping:IActionMapping = {
  mouse: {
    click: (node, tree, $event) => {
      $event.ctrlKey
        ? TREE_ACTIONS.TOGGLE_SELECTED_MULTI(node, tree, $event)
        : TREE_ACTIONS.TOGGLE_SELECTED(node, tree, $event)
    }
  }
};

const WINDOW_PROVIDER: ValueProvider = {
  provide: Window,
  useValue: window
};

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [   // :enter is alias to 'void => *'
        style({opacity:0}),
        animate(600, style({opacity:1}))
      ]),
      transition(':leave', [   // :leave is alias to '* => void'
        animate(500, style({opacity:0}))
      ])
    ])
  ]
})
export class ViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() dashboard: any;

  private subscription: Subscription;
  private indicatorCalls: Subscription[] = [];
  scorecard: ScoreCard;
  scorecardId: string;
  orgUnit: any = {};
  period: any = {};
  orgunits: any[] = [];
  loading: boolean = true;
  base_url: string;
  orgunit_tree_config: any = {
    show_search : true,
    search_text : 'Search',
    level: null,
    loading: false,
    loading_message: 'Loading Organisation units...',
    multiple: true,
    placeholder: "Select Organisation Unit"
  };

  period_tree_config: any = {
    show_search : true,
    search_text : 'Search',
    level: null,
    loading: false,
    loading_message: 'Loading Periods...',
    multiple: true,
    placeholder: "Select period"
  };
  organisationunits: any[] = [];
  periods: any[] = [];
  selected_orgunits: any[] = [];
  selected_periods:any[] = [];
  period_type: string = "Quarterly";
  year: number = 2016;
  default_orgUnit: string[] = [];
  default_period: string[] = [];
  showOrgTree:boolean = true;
  showPerTree:boolean = true;
  showAdditionalOptions:boolean = true;

  show_details:boolean = false;

  @ViewChild('orgtree')
  orgtree: TreeComponent;

  @ViewChild('pertree')
  pertree: TreeComponent;

  @ViewChild(ScorecardComponent)
  private childScoreCard: ScorecardComponent;

  selected_indicator: any = [];
  orgunit_for_model:any = [];

  keep_options_open:boolean = true;

  show_sum_in_row: boolean = false;
  show_sum_in_column: boolean = false;
  show_average_in_row: boolean = false;
  show_average_in_column: boolean = false;
  hide_empty_column: boolean = false;
  hide_empty_rows: boolean = false;

  sortAscending: boolean = true;
  sorting_column: any = "none";
  hidenColums: any[] = [];

  shown_records:number = 0;
  average_selection:string = "all";
  show_rank: boolean = false;
  metadata_ready = false;
  have_authorities:boolean = false;
  orgUnitlength:number = 0;

  orgunit_model: any = {
    selection_mode: "orgUnit",
    selected_level: "",
    selected_group: "",
    orgunit_levels: [],
    orgunit_groups: [],
    selected_orgunits: [],
    user_orgunits: [],
    selected_user_orgunit: "USER_ORGUNIT"
  };
  dashboardAvaible:boolean = false;
  constructor(private scorecardService: ScorecardService,
              private dataService: DataService,
              private filterService: FilterService,
              private costant: Constants,
              private orgunitService: OrgUnitService,
              private cardWidgetService: CardWidgetService
  ) {
    this.base_url = this.costant.root_dir;
    this.scorecard = this.getEmptyScoreCard();
    this.dataService.getUserInformation().subscribe(
      userInfo => {
        //noinspection TypeScriptUnresolvedVariable
        userInfo.userCredentials.userRoles.forEach( (role) => {
          role.authorities.forEach( (ath) => {
            if( ath == "ALL"){
              this.have_authorities = true;
            }
          });
        })
      }
    )

  }

  pushPeriodForward(){
    this.year += 1;
    this.periods = this.filterService.getPeriodArray(this.period_type,this.year);
  }

  pushPeriodBackward(){
    this.year -= 1;
    this.periods = this.filterService.getPeriodArray(this.period_type,this.year);
  }

  changePeriodType(){
    this.periods = this.filterService.getPeriodArray(this.period_type,this.year);
  }

  ngOnInit() {
    //loading organisation units
    this.orgunit_tree_config.loading = true;
    this.cardWidgetService.load(this.dashboard).subscribe(
      (cardWidgetdata) => {
        this.orgunit_model = cardWidgetdata.organisation_unit;
        this.scorecardId = cardWidgetdata.scoreCardId;
        this.period_type = cardWidgetdata.periodType;
        this.period = cardWidgetdata.period;

        this.scorecardService.load(this.scorecardId).subscribe(
          scorecard_details => {
            this.scorecard = {
              id: this.scorecardId,
              name: scorecard_details.header.title,
              data: scorecard_details
            };

            if(!this.scorecard.data.hasOwnProperty("empty_rows")){
              this.scorecard.data.empty_rows = true;
            }
            if(this.scorecard.data.hasOwnProperty("periodType")){
              this.period_type = this.scorecard.data.periodType
            }
            this.periods = this.filterService.getPeriodArray( this.period_type, this.year );
            this.period = {
              id:this.filterService.getPeriodArray( this.period_type, this.year )[0].id,
              name:this.filterService.getPeriodArray( this.period_type, this.year )[0].name
            };
            this.metadata_ready = true;
            this.activateNode(this.period.id, this.pertree);
            if (this.orgunitService.nodes == null) {
              this.orgunitService.getOrgunitLevelsInformation()
                .subscribe(
                  (data: any) => {
                    // assign urgunit levels and groups to variables
                    this.orgunit_model.orgunit_levels = data.organisationUnitLevels;
                    this.orgunitService.getOrgunitGroups().subscribe( groups => {//noinspection TypeScriptUnresolvedVariable
                      this.orgunit_model.orgunit_groups = groups.organisationUnitGroups
                    });

                    this.orgunitService.getUserInformation().subscribe(
                      userOrgunit => {
                        let level = this.orgunitService.getUserHighestOrgUnitlevel( userOrgunit );
                        this.orgunit_model.user_orgunits = this.orgunitService.getUserOrgUnits( userOrgunit );
                        let all_levels = data.pager.total;
                        let orgunits = this.orgunitService.getuserOrganisationUnitsWithHighestlevel( level, userOrgunit );
                        let use_level = parseInt(all_levels) - (parseInt(level) - 1);
                        this.orgunit_model.user_orgunits = orgunits;

                        //load inital orgiunits to speed up loading speed
                        this.orgunitService.getInitialOrgunitsForTree(orgunits).subscribe(
                          (initial_data) => {
                            //noinspection TypeScriptUnresolvedVariable

                            this.orgUnitlength = 0;

                            //noinspection TypeScriptUnresolvedVariable
                            this.organisationunits = initial_data.organisationUnits;
                            this.orgunit_tree_config.loading = false;
                            // after done loading initial organisation units now load all organisation units
                            let fields = this.orgunitService.generateUrlBasedOnLevels(use_level);
                            this.orgunitService.getAllOrgunitsForTree1(fields, orgunits).subscribe(
                              items => {
                                //noinspection TypeScriptUnresolvedVariable
                                this.organisationunits = items.organisationUnits;
                                //noinspection TypeScriptUnresolvedVariable
                                this.orgunitService.nodes = items.organisationUnits;
                                this.activateNode(this.orgUnit.id, this.orgtree);
                                this.prepareOrganisationUnitTree(this.organisationunits, 'parent');
                              },
                              error => {
                                console.log('something went wrong while fetching Organisation units');
                                this.orgunit_tree_config.loading = false;
                              }
                            )
                          },
                          error => {
                            console.log('something went wrong while fetching Organisation units');
                            this.orgunit_tree_config.loading = false;
                          }
                        )

                      }
                    )
                  }
                );
            }
            else {
              this.orgunit_tree_config.loading = false;
              this.default_orgUnit = [this.orgunitService.nodes[0].id];
              this.orgUnitlength = this.orgUnit.children.length+1;
              this.organisationunits = this.orgunitService.nodes;
              this.orgunit_model.orgunit_levels = this.orgunitService.orgunit_levels;
              this.orgunitService.getOrgunitGroups().subscribe( groups => {//noinspection TypeScriptUnresolvedVariable
                this.orgunit_model.orgunit_groups = groups.organisationUnitGroups
              });
              this.activateNode(this.orgUnit.id, this.orgtree);
              this.prepareOrganisationUnitTree(this.organisationunits, 'parent');
              // TODO: make a sort level information dynamic
              this.metadata_ready = true;
              this.loadScoreCard();
            }
      });
      },error => {
        this.dashboardAvaible = false;
      }
    )
  }

  updateOrgunitLength($event){
    this.orgUnitlength = $event;
  }

  ngAfterViewInit(){

  }

  // this function is used to sort organisation unit
  prepareOrganisationUnitTree(organisationUnit,type:string='top') {
    if (type == "top"){
      if (organisationUnit.children) {
        organisationUnit.children.sort((a, b) => {
          if (a.name > b.name) {
            return 1;
          }
          if (a.name < b.name) {
            return -1;
          }
          // a must be equal to b
          return 0;
        });
        organisationUnit.children.forEach((child) => {
          this.prepareOrganisationUnitTree(child,'top');
        })
      }
    }else{
      organisationUnit.forEach((orgunit) => {
        console.log(orgunit);
        if (orgunit.children) {
          orgunit.children.sort((a, b) => {
            if (a.name > b.name) {
              return 1;
            }
            if (a.name < b.name) {
              return -1;
            }
            // a must be equal to b
            return 0;
          });
          orgunit.children.forEach((child) => {
            this.prepareOrganisationUnitTree(child,'top');
          })
        }
      });
    }
  }

  // prepare a proper name for updating the organisation unit display area.
  getProperPreOrgunitName() : string{
    let name = "";
    if( this.orgunit_model.selection_mode == "Group" ){
      let use_value = this.orgunit_model.selected_group.split("-");
      for( let single_group of this.orgunit_model.orgunit_groups ){
        if ( single_group.id == use_value[1] ){
          name = single_group.name + " in";
        }
      }
    }else if( this.orgunit_model.selection_mode == "Usr_orgUnit" ){
      if( this.orgunit_model.selected_user_orgunit == "USER_ORGUNIT") name = "User org unit";
      if( this.orgunit_model.selected_user_orgunit == "USER_ORGUNIT_CHILDREN") name = "User sub-units";
      if( this.orgunit_model.selected_user_orgunit == "USER_ORGUNIT_GRANDCHILDREN") name = "User sub-x2-units";
    }else if( this.orgunit_model.selection_mode == "Level" ){
      let use_level = this.orgunit_model.selected_level.split("-");
      for( let single_level of this.orgunit_model.orgunit_levels ){
        if ( single_level.level == use_level[1] ){
          name = single_level.name + " in";
        }
      }
    }else{
      name = "";
    }
    return name
  }

  // a function that will be used to load scorecard
  loadScoreCard( orgunit: any = null ){
    this.showOrgTree = true;
    this.showPerTree = true;
    this.orgUnitlength = (this.orgUnit.children)?this.orgUnit.children.length+1:1;
    this.childScoreCard.loadScoreCard();
  }

  //setting the period to next or previous
  setPeriod(type){
    if(type == "down"){
      this.periods = this.filterService.getPeriodArray(this.period_type, this.filterService.getLastPeriod(this.period.id,this.period_type).substr(0,4));
      this.activateNode(this.filterService.getLastPeriod(this.period.id,this.period_type), this.pertree);
      this.period = {
        id:this.filterService.getLastPeriod(this.period.id,this.period_type),
        name:this.getPeriodName(this.filterService.getLastPeriod(this.period.id,this.period_type))
      };

    }
    if(type == "up"){
      this.periods = this.filterService.getPeriodArray(this.period_type, this.filterService.getNextPeriod(this.period.id,this.period_type).substr(0,4));
      this.activateNode(this.filterService.getNextPeriod(this.period.id,this.period_type), this.pertree);
      this.period = {
        id:this.filterService.getNextPeriod(this.period.id,this.period_type),
        name:this.getPeriodName(this.filterService.getNextPeriod(this.period.id,this.period_type))
      };

    }
    setTimeout(() => {
      this.loadScoreCard()
    }, 5);
  }

  // get the name of period to be used in a tittle
  getPeriodName(id){
    for ( let period of this.filterService.getPeriodArray(this.period_type, this.filterService.getLastPeriod(id,this.period_type).substr(0,4))){
      if( this.filterService.getLastPeriod(id,this.period_type) == period.id){
        return period.name;
      }
    }
  }

  // prepare scorecard data and download them as csv
  downloadCSV(orgunitId){
    let data = [];
    let use_orgunit = this.orgtree.treeModel.getNodeById(orgunitId)
    for ( let current_orgunit of use_orgunit.data.children ){
      let dataobject = {};
      dataobject['orgunit'] = current_orgunit.name;
      for ( let holder of this.scorecard.data.data_settings.indicator_holders ){
        for( let indicator of holder.indicators ){
          dataobject[indicator.title] = indicator.values[current_orgunit.id];
        }
      }
      data.push( dataobject  );
    }

    let options = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalseparator: '.',
      showLabels: true,
      showTitle: false
    };

    new Angular2Csv(data, 'My Report', options);
  }

  // invoke a default browser print function
  browserPrint(){
    window.print();
  }

  // load a preview function
  loadPreview($event){
    this.selected_indicator = [];
    // prepare indicators
    if($event.holderGroup == null){
      this.selected_indicator = [$event.indicator];
    }else{
      for( let holderid of $event.holderGroup.indicator_holder_ids ){
        for ( let holder of this.scorecard.data.data_settings.indicator_holders ){
          if( holder.holder_id == holderid ){
            this.selected_indicator.push(holder);
          }
        }
      }
    }

    //prepare organisation units
    if($event.ou == null){
      this.orgunit_for_model = this.orgUnit;
    }else{
      let node = this.orgtree.treeModel.getNodeById($event.ou);
      this.orgunit_for_model = node.data;
    }
    this.show_details = true;
  }

  removeModel(){
    this.show_details = false;
  }

  // a function to prepare a list of indicators to pass into a table
  getIndicatorsList(scorecard): string[]{
    let indicators = [];
    for( let holder of scorecard.data.data_settings.indicator_holders ){
      for( let indicator of holder.indicators ){
        indicators.push(indicator);
      }
    }
    return indicators;
  }

  // Define default scorecard sample
  getEmptyScoreCard():ScoreCard{
    return {
      id: this.scorecardId,
      name:"",
      data: {
        "orgunit_settings": {
          "parent": "USER_ORGUNIT",
          "level": "LEVEL-2"
        },
        "periodType": "Quarterly",
        "show_score": false,
        "show_rank": false,
        "empty_rows":true,
        "rank_position_last": true,
        "header": {
          "title": "",
          "sub_title":"",
          "description": "",
          "show_arrows_definition": true,
          "show_legend_definition": false,
          "template": {
            "display": false,
            "content": ""
          }
        },
        "legendset_definitions": [
          {
            "color": "#008000",
            "definition": "Target achieved / on track"
          },
          {
            "color": "#FFFF00",
            "definition": "Progress, but more effort required"
          },
          {
            "color": "#FF0000",
            "definition": "Not on track"
          },
          {
            "color": "#D3D3D3",
            "definition": "N/A"
          },
          {
            "color": "#FFFFFF",
            "definition": "No data"
          }
        ],
        "highlighted_indicators": {
          "display": false,
          "definitions": []
        },
        "data_settings": {
          "indicator_holders": [],
          "indicator_holder_groups": []
        },
        "additional_labels": [],
        "footer": {
          "display_generated_date": false,
          "display_title": false,
          "sub_title": null,
          "description": null,
          "template": null
        },
        "indicator_dataElement_reporting_rate_selection": "Indicators"
      }
    }
  }

  // custom settings for tree
  customTemplateStringOrgunitOptions: any = {
    isExpandedField: 'expanded',
    actionMapping
  };
  // custom settings for tree
  customTemplateStringPeriodOptions: any = {
    isExpandedField: 'expanded',
    actionMapping1
  };

  // display Orgunit Tree
  displayOrgTree(){
    this.showOrgTree = !this.showOrgTree;
  }

  // display period Tree
  displayPerTree(){
    this.showPerTree = !this.showPerTree;
  }

  // action to be called when a tree item is deselected(Remove item in array of selected items
  deactivateOrg ( $event ) {
    console.log($event.node.data);
    this.orgunit_model.selected_orgunits.forEach((item,index) => {
      if( $event.node.data.id == item.id ) {
        this.orgunit_model.selected_orgunits.splice(index, 1);
      }
    });
  };

  // action to be called when a tree item is deselected(Remove item in array of selected items
  deactivatePer ( $event ) {

  };

  // add item to array of selected items when item is selected
  activateOrg = ($event) => {
    this.selected_orgunits = [$event.node.data];
    if(!this.checkOrgunitAvailabilty($event.node.data, this.orgunit_model.selected_orgunits)){
      this.orgunit_model.selected_orgunits.push($event.node.data);
    }
    this.orgUnit = $event.node.data;
  };

  // add item to array of selected items when item is selected
  activatePer = ($event) => {
    this.selected_periods = [$event.node.data];
    this.period = $event.node.data;
  };

  activateNode(nodeId:any, nodes){
    setTimeout(() => {
      let node = nodes.treeModel.getNodeById(nodeId);
      if (node)
        node.toggleActivated();
    }, 0);
  }

  // check if orgunit already exist in the orgunit display list
  checkOrgunitAvailabilty(orgunit, array): boolean{
    let checker = false;
    array.forEach((value) => {
      if( value.id == orgunit.id ){
        checker = true;
      }
    });
    return checker;
  }

  // function that is used to filter nodes
  filterNodes(text, tree) {
    tree.treeModel.filterNodes(text, true);
  }

  // help function to help on closing the indicator modal popup
  getDetails($event){
    this.show_details = $event
  }

  showOptions(){
    this.showAdditionalOptions = !this.showAdditionalOptions;
  }

  /**
   * finding the row average
   * @param orgunit_id
   */
  findRowAverage(orgunit_id){
    let sum = 0;
    let counter = 0;
    for ( let holder of this.scorecard.data.data_settings.indicator_holders ){
      for( let indicator of holder.indicators ){
        if( this.hidenColums.indexOf(indicator.id) == -1) {
          counter++;
          sum = sum + parseFloat(indicator.values[orgunit_id]);
        }
      }
    }
    return (sum / counter).toFixed(2);
  }
  /**
   * finding the row average
   * @param orgunit_id
   */
  findRowTotalAverage(orgunits){
    let sum = 0;
    let n = 0;
    for ( let holder of this.scorecard.data.data_settings.indicator_holders ){
      for( let indicator of holder.indicators ){
        if( this.hidenColums.indexOf(indicator.id) == -1 ){
          for ( let orgunit of orgunits ){
            if(orgunit.id in indicator.values && indicator.values[orgunit.id] != null){
              n++;
              sum = sum + parseFloat(indicator.values[orgunit.id])
            }
          }
        }
      }
    }
    return (sum / n).toFixed(2);
  }

  /**
   * finding the row average
   * @param orgunit_id
   */
  findRowTotalSum(orgunits){
    let sum = 0;
    let n = 0;
    for ( let holder of this.scorecard.data.data_settings.indicator_holders ){
      for( let indicator of holder.indicators ){
        if( this.hidenColums.indexOf(indicator.id) == -1 ){
          for ( let orgunit of orgunits ){
            if(orgunit.id in indicator.values && indicator.values[orgunit.id] != null){
              n++;
              sum = sum + parseFloat(indicator.values[orgunit.id])
            }
          }
        }
      }
    }
    return sum;
  }

  /**
   * Finding avarage for the column
   * @param orgunits, indicator_id
   */
  findColumnAverage(orgunits, indicator_id,scorecard){
    let sum = 0;
    for ( let orgunit of orgunits ){
      for ( let holder of scorecard.data.data_settings.indicator_holders ){
        for( let indicator of holder.indicators ){
          if(orgunit.id in indicator.values && indicator.id == indicator_id){
            sum = sum + parseFloat(indicator.values[orgunit.id])
          }
        }
      }
    }
    return (sum/ this.getIndicatorsList(this.scorecard).length).toFixed(2);
  }

  /**
   * Finding avarage for the column
   * @param orgunits, indicator_id
   */
  findColumnSum(orgunits, indicator_id, scorecard){
    let sum = 0;
    for ( let orgunit of orgunits ){
      for ( let holder of scorecard.data.data_settings.indicator_holders ){
        for( let indicator of holder.indicators ){
          if(orgunit.id in indicator.values && indicator.id == indicator_id){
            sum = sum + parseFloat(indicator.values[orgunit.id])
          }
        }
      }
    }
    return sum;
  }

  /**
   * finding the row average
   * @param orgunit_id
   */
  findRowSum(orgunit_id){
    let sum = 0;
    for ( let holder of this.scorecard.data.data_settings.indicator_holders ){
      for( let indicator of holder.indicators ){
        if(orgunit_id in indicator.values && indicator.values[orgunit_id] != null ){
          if( this.hidenColums.indexOf(indicator.id) == -1) {
            sum = sum + parseFloat(indicator.values[orgunit_id])
          }
        }
      }
    }
    return sum;
  }

  // dealing with showing sum
  enableLegend(e){
    this.scorecard.data.header.show_legend_definition = e.target.checked;
    let close = (this.keep_options_open)?'':this.showOptions();
  }

  // dealing with showing average
  showAverageInRow(e){
    this.show_average_in_row = e.target.checked;
    let close = (this.keep_options_open)?'':this.showOptions();
  }

  // dealing with showing average
  showAverageInColumn(e){
    this.show_average_in_column = e.target.checked;
    let close = (this.keep_options_open)?'':this.showOptions();
  }

  // dealing with showing average
  hideEmptyColumn(e){
    this.hide_empty_column = e.target.checked;
    let close = (this.keep_options_open)?'':this.showOptions();
  }

  // hiding columns
  hideColums(){
    console.log(this.hidenColums);
  }

  sortScoreCard(sortingColumn, sortAscending){
    if( sortingColumn == "none" ){
      this.dataService.sortArrOfObjectsByParam(this.orgunits, "name", sortAscending)
    }
    else if( sortingColumn == 'avg' ){
      for ( let orgunit of this.orgunits ){
        orgunit['avg'] = parseFloat(this.findRowAverage(orgunit.id));
      }
      this.dataService.sortArrOfObjectsByParam(this.orgunits, sortingColumn, sortAscending)
    }
    else if( sortingColumn == 'sum' ){
      for ( let orgunit of this.orgunits ){
        orgunit['sum'] = this.findRowSum(orgunit.id);
      }
      this.dataService.sortArrOfObjectsByParam(this.orgunits, sortingColumn, sortAscending)
    }
    else{
      for ( let orgunit of this.orgunits ){
        orgunit[sortingColumn] = this.findOrgunitIndicatorValue(orgunit.id, sortingColumn );
      }
      this.dataService.sortArrOfObjectsByParam(this.orgunits, sortingColumn, sortAscending)
    }
    let close = (this.keep_options_open)?'':this.showOptions();
  }

  private findOrgunitIndicatorValue(orgunit_id: string, indicator_id:string){
    let val:number = 0;
    for ( let holder of this.scorecard.data.data_settings.indicator_holders ){
      for( let indicator of holder.indicators ){
        if(orgunit_id in indicator.values && indicator.values[orgunit_id] != null && indicator.id == indicator_id){
          val = parseFloat(indicator.values[orgunit_id])
        }
      }
    }
    return val;
  }

  ngOnDestroy (){
    if( this.subscription ){
      this.subscription.unsubscribe();
    }

    for( let subscr of this.indicatorCalls ){
      if( subscr ){
        subscr.unsubscribe();
      }
    }
  }

}
