//Angular
import { Component, OnInit } from '@angular/core';

//Services
import { LayoutService } from 'src/app/layout/service/app.layout.service';

//Store
import { Observable, Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { CompanyState } from 'src/app/stores/dropdown-select-company/dropdown-select-company.reducer';
import { AuthState } from 'src/app/stores/auth/authentication.reducer';

//Libraies
import * as moment from 'moment';

//Utils
import Formatter from 'src/app/utils/formatters';
import { FormBuilder, Validators } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';
import { ROUTES } from 'src/app/utils/constants';
import { PermissionService } from 'src/app/services/permission.service';
import { MessageService } from 'primeng/api';

@Component({
    templateUrl: './permission-home.component.html',
    styleUrls: ['./permission-home.component.scss'],
})
export class PermissionHomeComponent implements OnInit {
    authState$: Observable<AuthState>;

    //Language
    locale: string;

    //Utils
    formatter!: Formatter;

    //Store
    subscription: Subscription;
    companyState$: Observable<CompanyState>;

    //Variables

    menuItems: any;
    loading: boolean;
    attendanceData: any;

    storeUser: any;
    currentUser: any;
    currentCompany: any;

    dates: Date[] | undefined;

    permissionForm = this.fb.group({
        typology: ['', [Validators.required]],
        dates: ['', [Validators.required]],
    });

    tipologyPermissionsItems: any = [
        {
            name: 'Malattia',
            value: 'Malattia',
        },
        {
            name: 'Permesso ROL',
            value: 'Permesso ROL',
        },
        {
            name: 'Ferie',
            value: 'Ferie',
        },
       
    ];
    selectedPermission: any;
    permissionData: any;

    constructor(
        public fb: FormBuilder,
        public layoutService: LayoutService,
        private permissionService: PermissionService,
        private messageService: MessageService,
        private userService: UserService,
        private router: Router,
        private store: Store<{ authState: AuthState }>,
    ) {
        //Init
        this.authState$ = store.select('authState');

        this.formatter = new Formatter();
    }

    ngOnInit(): void {
        this.authState$.subscribe((authS) => {
            this.storeUser = authS?.user || '';
            this.loadServices(this.storeUser);
        });
        const layourServiceSubscription =
            this.layoutService.configUpdate$.subscribe(() => {
                this.loadServices(this.currentUser);
            });
        if (this.subscription) {
            this.subscription.add(layourServiceSubscription);
        }
    }

    loadServices(storeUser) {
        const permissionServiceSubscription = this.permissionService
            .getPermissionByUser(storeUser.id)
            .subscribe((data) => {
                this.permissionData = data;

                this.loading = false;
            });
        const userServiceSubscription = this.userService
            .getUser(storeUser.id)
            .subscribe((data) => {
                this.currentUser = data;
                this.currentCompany = data?.companies[0];
            });

        if (permissionServiceSubscription && this.subscription)
            this.subscription.add(permissionServiceSubscription);

        if (userServiceSubscription && this.subscription)
            this.subscription.add(userServiceSubscription);
    }

    savePermission() {
        let datesInString;

        for (let date of this.permissionForm.value.dates) {
            if (datesInString != null) {
                datesInString =
                    datesInString + ',' + moment(date).format('DD-MM-YYYY');
            } else {
                datesInString = moment(date).format('DD-MM-YYYY');
            }
        }
        this.permissionService
            .createPermission(
                this.currentUser?.id,
                this.currentCompany?.id,
                this.permissionForm.value.typology,
                datesInString,
            )
            .subscribe((res) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Permesso',
                    detail: 'Hai fatto richiesta con successo',
                });
                this.router.navigate([ROUTES.ROUTE_LANDING_HOME]);
            });
    }
}
